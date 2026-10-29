from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.HealthView.as_view()),
    path("auth/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("auth/change-password/", views.ChangePasswordView.as_view()),
    path("profile/", views.ProfileView.as_view()),
    path("calculations/", views.CalculationListCreateView.as_view()),
    path("calculations/<uuid:id>/", views.CalculationDeleteView.as_view()),
]
