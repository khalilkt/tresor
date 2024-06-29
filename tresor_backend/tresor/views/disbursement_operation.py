from tresor.utils import filter_query_by_date
from ..models.disbursement_operation import DisbursementOperation, DisbursementOperationSerializer
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, RetrieveAPIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAdminUser, IsAuthenticated


class DisbursementOperationListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    
    serializer_class = DisbursementOperationSerializer
    filterset_fields = ['account', 'created_by']
    search_fields = ['motif', 'beneficiaire']
    ordering_fields = ['date', 'motif', 'beneficiaire']
    ordering = ['-date', "-created_at"]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return DisbursementOperation.objects.all()
        return DisbursementOperation.objects.filter(created_by=user)

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
    

class DisbursementOperationDetails(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = DisbursementOperation.objects.all()
    serializer_class = DisbursementOperationSerializer


