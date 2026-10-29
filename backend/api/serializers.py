import math

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .models import Calculation, Profile

User = get_user_model()

MAX_VALUE = 1e12  # sanity limit for any number a user can submit


def clean_email(value):
    return value.strip().lower()


# ------------------------------------------------------------------ accounts
class RegisterSerializer(serializers.Serializer):
    company_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=254)
    password = serializers.CharField(write_only=True, min_length=8, max_length=128)

    def validate_company_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Company name is required.")
        return value

    def validate_email(self, value):
        value = clean_email(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["email"],
            email=validated_data["email"],
            password=validated_data["password"],
        )
        Profile.objects.create(user=user, company_name=validated_data["company_name"])
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=clean_email(attrs["email"]),
            password=attrs["password"],
        )
        # Same message for "no such user" and "wrong password" (no account probing).
        if user is None or not user.is_active:
            raise serializers.ValidationError("Incorrect email or password.")
        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="user_id", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    company_name = serializers.CharField(max_length=100)
    phone_number = serializers.CharField(
        max_length=20, required=False, allow_blank=True, allow_null=True
    )
    industry = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )
    location = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )

    class Meta:
        model = Profile
        fields = ["id", "company_name", "email", "phone_number", "industry", "location", "created_at"]
        read_only_fields = ["created_at"]

    def validate_company_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Company name is required.")
        return value

    def validate_phone_number(self, value):
        import re

        value = (value or "").strip()
        if value and not re.fullmatch(r"[+\d][\d\s()-]{5,19}", value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def validate_industry(self, value):
        return (value or "").strip()

    def validate_location(self, value):
        return (value or "").strip()


class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=8, max_length=128)

    def validate_new_password(self, value):
        try:
            validate_password(value, user=self.context["request"].user)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(list(exc.messages))
        return value


# -------------------------------------------------------------- calculations
# Which input fields each calculator needs (matches CALC_FIELDS in src/lib/calc.js).
REQUIRED_INPUTS = {
    "profit": ["units", "pricePerUnit", "totalCost", "duration", "durationUnit"],
    "units": ["targetProfit", "pricePerUnit", "totalCost", "duration", "durationUnit"],
    "input_cost": ["targetProfit", "units", "pricePerUnit"],
    "price_per_unit": ["targetProfit", "units", "totalCost", "duration", "durationUnit"],
}
WHOLE_NUMBER_FIELDS = {"units", "duration"}


def as_finite_number(value, label):
    # bool is a subclass of int in Python; reject it explicitly.
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise serializers.ValidationError(f"{label} must be a number.")
    if not math.isfinite(value) or abs(value) > MAX_VALUE:
        raise serializers.ValidationError(f"{label} is out of range.")
    return float(value)


class CalculationSerializer(serializers.ModelSerializer):
    inputs = serializers.DictField()
    result = serializers.FloatField()
    profit = serializers.FloatField()

    class Meta:
        model = Calculation
        fields = ["id", "type", "inputs", "result", "profit", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_result(self, value):
        return as_finite_number(value, "Result")

    def validate_profit(self, value):
        return as_finite_number(value, "Profit")

    def validate(self, attrs):
        calc_type = attrs["type"]
        raw = attrs["inputs"]
        required = REQUIRED_INPUTS[calc_type]

        errors = {}
        cleaned = {}
        for name in required:
            if name not in raw:
                errors[name] = "This field is required."
                continue
            try:
                number = as_finite_number(raw[name], name)
            except serializers.ValidationError as exc:
                errors[name] = exc.detail[0]
                continue

            if name == "durationUnit":
                if number not in (1.0, 12.0):
                    errors[name] = "Duration unit must be months (1) or years (12)."
                    continue
            elif name != "targetProfit" and number <= 0:
                errors[name] = "Must be greater than 0."
                continue
            if name in WHOLE_NUMBER_FIELDS and not number.is_integer():
                errors[name] = "Must be a whole number."
                continue
            cleaned[name] = int(number) if name in WHOLE_NUMBER_FIELDS or name == "durationUnit" else number

        if errors:
            raise serializers.ValidationError({"inputs": errors})

        attrs["inputs"] = cleaned  # unknown keys are dropped
        return attrs
