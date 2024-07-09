from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from rest_framework import serializers
from django.db.models import Count

from tresor.models.collection_operation import CollectionOperation
from tresor.models.disbursement_operation import DisbursementOperation
from django.db.models import OuterRef, Subquery 

class UserManager(BaseUserManager):
    def create_user(self, username, name, password):
        if not username or len(username.strip()) < 3:
            raise ValueError('Users must have an username with at least 3 characters')
        if not password:
            raise ValueError('Users must have a password')
        if not name or name == "": 
            raise ValueError('Users must have a name')
        user = self.model( username=username, name = name, is_superuser = False, is_admin = False, is_active = True)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username,name, password):
        user = self.create_user(username=username, name = name,  password=password)
        user.is_admin = True
        user.is_superuser = True
        user.save(using=self._db)
        return user

    def get_queryset(self):
        ret = super().get_queryset()
        return ret
    
class User(AbstractBaseUser): 
    username = models.CharField(max_length=255, unique=True)
    name = models.CharField(max_length=255)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    has_accounts_access = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    REQUIRED_FIELDS = ['name']
    USERNAME_FIELD = 'username'
    assigned_vault_groups = models.ManyToManyField('tresor.VaultGroup', related_name='assigned_users')

    objects = UserManager()

    @property
    def is_staff(self):
        return self.is_admin or self.is_superuser

class UserSerializer(serializers.ModelSerializer): 
    total_collection_operations = serializers.SerializerMethodField()
    total_disbursement_operations = serializers.SerializerMethodField()

    def get_total_collection_operations(self, obj):
        return obj.collection_operations.count()
    
    def get_total_disbursement_operations(self, obj):
        return obj.disbursement_operations.count()
    
    def create(self, validated_data):
        user = User.objects.create_user(username=validated_data['username'], password=validated_data['password'], name=validated_data['name'])
        user.is_admin = validated_data.get('is_admin', False)
        user.has_accounts_access = validated_data.get('has_accounts_access', True)
        # update assigned vault groups
        if 'assigned_vault_groups' in validated_data:
            user.assigned_vault_groups.set(validated_data['assigned_vault_groups'])
        
        user.save()
        return user

    def update(self, instance, validated_data):
        instance.name = validated_data.get('name', instance.name)
        instance.username = validated_data.get('username', instance.username)   
        instance.is_superuser = validated_data.get('is_superuser', instance.is_superuser)
        instance.has_accounts_access = validated_data.get('has_accounts_access', instance.has_accounts_access)
        if 'assigned_vault_groups' in validated_data:
            instance.assigned_vault_groups.set(validated_data['assigned_vault_groups'])
        if "password" in validated_data:
            instance.set_password(validated_data['password'])
        instance.save()
        return instance

    class Meta:
        model = User
        fields = "__all__" 
        extra_kwargs = {'password': {'write_only': True}} 




