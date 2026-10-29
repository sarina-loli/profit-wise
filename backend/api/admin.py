from django.contrib import admin

from .models import Calculation, Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("company_name", "user", "industry", "location", "created_at")
    search_fields = ("company_name", "user__email")


@admin.register(Calculation)
class CalculationAdmin(admin.ModelAdmin):
    list_display = ("type", "user", "result", "profit", "created_at")
    list_filter = ("type",)
