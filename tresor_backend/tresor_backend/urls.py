"""
URL configuration for tresor_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from tresor.views import AccountViewSet , AccountReleve, CollectionOperationListCreateView, DisbursementOperationListCreateView, DisbursementOperationDetails, CollectionOperationDetail, StatsView

from authentication.views import LoginTokenView, LoginView, PasswordUpdateView, UsersViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'accounts', AccountViewSet)
router.register(r'users', UsersViewSet, basename="users")

urlpatterns = [
    path('stats/', StatsView.as_view(), name="stats"),

    path('admin/', admin.site.urls),
    path('auth/token/', LoginTokenView.as_view(), name="login-token"),
    path('auth/login/', LoginView.as_view(), name="login"),
    path('users/<int:user_id>/update_password/', PasswordUpdateView.as_view(), name="password-update"),


    path('collections/', CollectionOperationListCreateView.as_view(), name="collections"),
    path('collections/<int:pk>/', CollectionOperationDetail.as_view(), name="collection-details"),

    path('disbursements/', DisbursementOperationListCreateView.as_view(), name="disbursements"),
    path('disbursements/<int:pk>/', DisbursementOperationDetails.as_view(), name="disbursement-details"),

    path('accounts/<int:pk>/releve/', AccountReleve.as_view(), name='account-releve'),
]

urlpatterns += router.urls

