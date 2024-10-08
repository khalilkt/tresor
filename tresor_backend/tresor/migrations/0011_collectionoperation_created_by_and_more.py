# Generated by Django 5.0.4 on 2024-06-29 19:22

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tresor', '0010_collectionoperation_type'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='collectionoperation',
            name='created_by',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, related_name='collection_operations', to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='disbursementoperation',
            name='created_by',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, related_name='disbursement_operations', to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name='collectionoperationdetail',
            name='destination_account',
            field=models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='collection_operations_details', to='tresor.account'),
        ),
        migrations.AlterField(
            model_name='disbursementoperation',
            name='account',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='disbursement_operations', to='tresor.account'),
        ),
    ]
