from tresor.utils import filter_query_by_date
from ..models.collection_operation import CollectionOperation, CollectionOperationSerializer
from rest_framework.generics import ListCreateAPIView, RetrieveAPIView, RetrieveUpdateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from ..models.account import Account



class CollectionOperationListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CollectionOperationSerializer
    filterset_fields = ['created_by', 'type']
    search_fields = ['ref']
    ordering_fields = ['date', 'motif', 'beneficiaire']
    ordering = ['-date', '-created_at']

    def get_queryset(self):
        user = self.request.user
        return CollectionOperation.objects.all()
        return CollectionOperation.objects.filter(created_by=user)

    def filter_queryset(self, queryset):
        ret =  super().filter_queryset(queryset)
        date = self.request.query_params.get('date', None)
        if date is not None:
            ret = filter_query_by_date(ret, date)
        return ret
    
    @property
    def pagination_class(self):
        if self.request.query_params.get('all', False) == "true":
            return None
        return super().pagination_class
    
    


class CollectionOperationDetail(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = CollectionOperation.objects.all()
    serializer_class = CollectionOperationSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        account_changes = {}
        # instance has detail and each one has a destination account, the account balance should be updated but the balance should positive
        for detail in instance.details.all():
            account = detail.destination_account
            account_changes[account] = account_changes.get(account, 0) + detail.montant
        for account, amount in account_changes.items():
            if account.balance - amount < 0:
                return Response("NOT_ENOUGH_BALANCE")
        for account, amount in account_changes.items():
            account.balance -= amount
            account.save()
        
        instance.delete()
        return Response("DELETED")
    
        

        


    
