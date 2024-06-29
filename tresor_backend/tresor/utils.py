def filter_query_by_date(queryset, date, filed_name = "date"):
    if not date:
        return queryset
    
    splited = date.split("-")
    if len(splited) == 1 and len(splited[0]) == 4:
        queryset = queryset.filter(**{f"{filed_name}__year": date})
    elif len(splited) == 2:
        queryset = queryset.filter(**{f"{filed_name}__year": splited[0], f"{filed_name}__month": splited[1]})
    elif len(splited) == 3:
        queryset = queryset.filter(**{f"{filed_name}__year": splited[0], f"{filed_name}__month": splited[1], f"{filed_name}__day": splited[2]})
    return queryset