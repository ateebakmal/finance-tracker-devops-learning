from datetime import UTC, date

from datetime import datetime
from zoneinfo import ZoneInfo
# 1. Your input string
date_string = "2026-08-02"

# 2. Convert string to a datetime object
datetime_obj = datetime.strptime(date_string, "%Y-%m-%d")

# 3. Drop the time parts to get a clean date object
date_obj = datetime_obj.date()

print(datetime.now(UTC).date())
print(datetime.now(ZoneInfo("Asia/Karachi")).date())


print(len('uq__categories__profile_id__type__parent_id__category_name_lower'))