from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as PasswordValidationError

Usuario = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'nombre_completo', 'rol', 'estado']
        read_only_fields = ['id', 'username', 'rol', 'estado']

    def get_nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class LoginSerializer(serializers.Serializer):
    """Acepta correo o nombre de usuario junto con la contraseña."""
    username = serializers.CharField(label='Correo o usuario')
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        identificador = attrs['username'].strip()
        password = attrs['password']

        usuario = None
        if '@' in identificador:
            usuario = Usuario.objects.filter(email__iexact=identificador).first()
        if usuario is None:
            usuario = Usuario.objects.filter(username__iexact=identificador).first()

        if usuario is None or not usuario.check_password(password):
            raise serializers.ValidationError('Credenciales inválidas.')
        if not usuario.estado:
            raise serializers.ValidationError('El usuario se encuentra inactivo.')

        refresh = RefreshToken.for_user(usuario)
        refresh['rol'] = usuario.rol

        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UsuarioSerializer(usuario).data,
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    password2 = serializers.CharField(write_only=True, trim_whitespace=False)
    rol = serializers.ChoiceField(choices=Usuario.ROLES, default='VENDEDOR')

    class Meta:
        model = Usuario
        fields = ['username', 'email', 'first_name', 'last_name',
                  'password', 'password2', 'rol']

    def validate_email(self, value):
        if Usuario.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo.')
        return value

    def validate_username(self, value):
        if Usuario.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este nombre.')
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Las contraseñas no coinciden.'})
        try:
            validate_password(attrs['password'])
        except PasswordValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        usuario = Usuario(**validated_data)
        usuario.set_password(password)
        usuario.save()
        return usuario


class CambiarPasswordSerializer(serializers.Serializer):
    """Cambio de contraseña del usuario autenticado."""
    password_actual = serializers.CharField(write_only=True, trim_whitespace=False)
    nueva_password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirmar_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        usuario = self.context['request'].user
        if not usuario.check_password(attrs['password_actual']):
            raise serializers.ValidationError(
                {'password_actual': 'La contraseña actual es incorrecta.'})
        if attrs['nueva_password'] != attrs['confirmar_password']:
            raise serializers.ValidationError(
                {'confirmar_password': 'Las contraseñas no coinciden.'})
        try:
            validate_password(attrs['nueva_password'], usuario)
        except PasswordValidationError as e:
            raise serializers.ValidationError({'nueva_password': list(e.messages)})
        return attrs
