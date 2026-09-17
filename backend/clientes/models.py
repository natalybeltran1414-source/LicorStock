from django.db import models


class Cliente(models.Model):
    TIPO_DOCUMENTO = (
        ('CEDULA', 'Cédula'),
        ('RUC', 'RUC'),
        ('CONSUMIDOR', 'Consumidor final'),
    )
    nombre = models.CharField(max_length=200)
    tipo_documento = models.CharField(max_length=20, choices=TIPO_DOCUMENTO, default='CEDULA')
    documento = models.CharField(max_length=20, blank=True, null=True, unique=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    direccion = models.CharField(max_length=255, blank=True, null=True)
    estado = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre
