from rest_framework.generics import ListAPIView
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework import viewsets
from ..models.vault import *
from rest_framework.permissions import IsAdminUser, BasePermission , IsAuthenticated
from django.db.models import F
from rest_framework.response import Response
from rest_framework import status
from rest_framework.filters import SearchFilter

class HasVaultAccessPermission(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_superuser or request.user.is_admin or request.user.has_vaults_access)

class VaultGroupListView(ListAPIView):
    queryset = VaultGroup.objects.all()
    serializer_class = VaultGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

class VaultListView(ListAPIView):
    queryset = Vault.objects.all().annotate(can_fund_transfer=F("group__can_fund_transfer"))
    serializer_class = VaultSerializer
    permission_classes = [HasVaultAccessPermission]
    filterset_fields = ['group']
    pagination_class = None
    ordering = ['group']

class VaultDetailView(RetrieveUpdateAPIView):
    queryset = Vault.objects.all()
    serializer_class = VaultSerializer
    permission_classes = [HasVaultAccessPermission]

class VaultDepositViewSet(viewsets.ModelViewSet):
    queryset = VaultDeposit.objects.all().annotate(vault_name=F('vault__name'))
    serializer_class = VaultDepositSerializer
    permission_classes = [HasVaultAccessPermission]
    ordering = ['-created_at']

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        params = self.request.query_params
        if "group" in params:
            group = params["group"]
            queryset = queryset.filter(vault__group=group)
        return queryset
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vault = instance.vault
        if vault.balance < instance.amount:
            return Response("NOT_ENOUGH_BALANCE", status=status.HTTP_400_BAD_REQUEST)
        with transaction.atomic():
            vault.balance -= instance.amount
            vault.save()
            instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class VaultWithdrawalViewSet(viewsets.ModelViewSet):
    queryset = VaultWithdrawal.objects.all().annotate(vault_name=F('vault__name'), account_name=F('account__name'))
    serializer_class = VaultWithdrawalSerializer
    permission_classes = [HasVaultAccessPermission]
    ordering = ['-created_at']

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        vault = instance.vault
        with transaction.atomic():
            vault.balance += instance.amount
            vault.save()
            if instance.account is not None:
                instance.account.balance -= instance.amount
                instance.account.save()
            instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        params = self.request.query_params
        if "group" in params:
            group = params["group"]
            queryset = queryset.filter(vault__group=group)
        return queryset
    