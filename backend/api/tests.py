from rest_framework.test import APITestCase

PROFIT_INPUTS = {"units": 1000, "pricePerUnit": 25, "totalCost": 1200, "duration": 12, "durationUnit": 1}


class ApiTests(APITestCase):
    def register(self, email="a@example.com", company="Acme"):
        return self.client.post(
            "/api/auth/register/",
            {"company_name": company, "email": email, "password": "S3curePass!9"},
            format="json",
        )

    def auth(self, token):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token}")

    def test_register_login_profile_flow(self):
        r = self.register()
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["profile"]["company_name"], "Acme")
        self.assertEqual(self.register().status_code, 400)  # duplicate email

        r = self.client.post("/api/auth/login/", {"email": "A@Example.com", "password": "S3curePass!9"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.auth(r.data["token"])

        r = self.client.patch("/api/profile/", {"phone_number": "+1 555 010 2030", "industry": "Food"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["industry"], "Food")
        r = self.client.patch("/api/profile/", {"phone_number": "abc"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_bad_login_and_weak_password(self):
        self.register()
        r = self.client.post("/api/auth/login/", {"email": "a@example.com", "password": "nope"}, format="json")
        self.assertEqual(r.status_code, 400)
        self.assertEqual(r.data["detail"], "Incorrect email or password.")
        r = self.client.post("/api/auth/register/", {"company_name": "X", "email": "b@example.com", "password": "12345678"}, format="json")
        self.assertEqual(r.status_code, 400)

    def test_requires_auth(self):
        self.assertEqual(self.client.get("/api/calculations/").status_code, 401)
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)

    def test_calculation_crud_and_isolation(self):
        token = self.register().data["token"]
        self.auth(token)
        body = {"type": "profit", "inputs": PROFIT_INPUTS, "result": 24900, "profit": 24900}
        r = self.client.post("/api/calculations/", body, format="json")
        self.assertEqual(r.status_code, 201, r.data)
        calc_id = r.data["id"]
        self.assertEqual(len(self.client.get("/api/calculations/").data), 1)

        # another user can't see or delete it
        other = self.register("b@example.com", "Other").data["token"]
        self.auth(other)
        self.assertEqual(self.client.get("/api/calculations/").data, [])
        self.assertEqual(self.client.delete(f"/api/calculations/{calc_id}/").status_code, 404)

        self.auth(token)
        self.assertEqual(self.client.delete(f"/api/calculations/{calc_id}/").status_code, 204)
        self.assertEqual(self.client.get("/api/calculations/").data, [])

    def test_calculation_validation(self):
        self.auth(self.register().data["token"])
        bad = dict(PROFIT_INPUTS, durationUnit=5)
        r = self.client.post("/api/calculations/", {"type": "profit", "inputs": bad, "result": 1, "profit": 1}, format="json")
        self.assertEqual(r.status_code, 400)
        missing = {k: v for k, v in PROFIT_INPUTS.items() if k != "duration"}
        r = self.client.post("/api/calculations/", {"type": "profit", "inputs": missing, "result": 1, "profit": 1}, format="json")
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/calculations/", {"type": "nope", "inputs": PROFIT_INPUTS, "result": 1, "profit": 1}, format="json")
        self.assertEqual(r.status_code, 400)
        r = self.client.post("/api/calculations/", {"type": "profit", "inputs": PROFIT_INPUTS, "result": 1e99, "profit": 1}, format="json")
        self.assertEqual(r.status_code, 400)
        # negative target profit is allowed
        r = self.client.post("/api/calculations/", {"type": "units", "inputs": {"targetProfit": -500, "pricePerUnit": 2, "totalCost": 100, "duration": 1, "durationUnit": 12}, "result": 1, "profit": 1}, format="json")
        self.assertEqual(r.status_code, 201, r.data)

    def test_change_password_and_logout(self):
        token = self.register().data["token"]
        self.auth(token)
        r = self.client.post("/api/auth/change-password/", {"new_password": "An0therPass!7"}, format="json")
        self.assertEqual(r.status_code, 200)
        self.assertNotEqual(r.data["token"], token)
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)  # old token dead
        self.auth(r.data["token"])
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 204)
        self.assertEqual(self.client.get("/api/profile/").status_code, 401)
