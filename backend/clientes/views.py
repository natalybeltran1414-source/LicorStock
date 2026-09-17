from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Cliente
from .serializers import ClienteSerializer, ClienteWriteSerializer


class ClienteViewSet(viewsets.ModelViewSet):
    queryset = Cliente.objects.order_by('nombre')
    serializer_class = ClienteSerializer

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClienteWriteSerializer
        return ClienteSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()
        return Response(ClienteSerializer(cliente).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        cliente = serializer.save()
        return Response(ClienteSerializer(cliente).data)

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        estado = self.request.query_params.get('estado')
        if search:
            qs = qs.filter(
                Q(nombre__icontains=search)
                | Q(documento__icontains=search)
                | Q(telefono__icontains=search)
            )
        if estado is not None:
            qs = qs.filter(estado=estado.lower() == 'true')
        return qs

    @action(detail=True, methods=['post'])
    def toggle_estado(self, request, pk=None):
        cliente = self.get_object()
        cliente.estado = not cliente.estado
        cliente.save(update_fields=['estado'])
        return Response(ClienteSerializer(cliente).data)

    def destroy(self, request, *args, **kwargs):
        # Las ventas conservan el registro del cliente; se desactiva en su lugar.
        cliente = self.get_object()
        cliente.estado = False
        cliente.save(update_fields=['estado'])
        return Response({'detail': 'Cliente desactivado.'}, status=status.HTTP_200_OK)
