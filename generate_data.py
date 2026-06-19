import pandas as pd
import numpy as np

# Set random seed for reproducibility
np.random.seed(42)

months = np.arange(1, 82)
staff_counts = []
total_sales = []

# Define standard employees
# sp1, sp2: Veterans (present 1-81, high sales)
# sp3: Left at month 45 (high helper)
# sp4: Hired month 2, veteran (high sales)
# sp5: Hired month 2, left month 60 (medium sales)
# sp6, sp7: Hired month 3, veteran (medium sales)
# sp8: Replaced sp3 at month 45 (medium sales)
# sp9: Replaced sp5 at month 61 (medium sales)
# sp10, sp11, sp12: Mid-tier helpers (introduced occasionally to cover gaps or peaks)
# sp13, sp14, sp15, sp16: Late low-performing hires (sales < 5k)

data = {f"sp{i}": [0.0] * 81 for i in range(1, 17)}

for m in months:
    # 1. Determine staff count and active employees
    if m == 1:
        count = 3
        active = ["sp1", "sp2", "sp3"]
    elif m == 2:
        count = 5
        active = ["sp1", "sp2", "sp3", "sp4", "sp5"]
    elif m == 3:
        count = 7
        active = ["sp1", "sp2", "sp3", "sp4", "sp5", "sp6", "sp7"]
    else:
        # Standard size is 7, but occasional overlaps (8 staff)
        # Nine months briefly had 8 staff. We'll specify them (e.g., months 15, 28, 40, 45, 52, 60, 68, 76, 80)
        overlaps = [15, 28, 40, 45, 52, 60, 68, 76, 80]
        if m in overlaps:
            count = 8
        else:
            count = 7
        
        # Decide active pool based on month
        active = ["sp1", "sp2", "sp4", "sp6", "sp7"] # Core 5 veterans always there
        
        # sp3 left in month 44, replaced by sp8 at month 45
        if m < 45:
            active.append("sp3")
        else:
            active.append("sp8")
            
        # sp5 left in month 60, replaced by sp9 at month 61
        if m <= 60:
            active.append("sp5")
        else:
            active.append("sp9")
            
        # If we have 8 staff, we add an extra person (short-term helper or overlapping trainee)
        if count == 8:
            if m == 15:
                active.append("sp10")
            elif m == 28:
                active.append("sp11")
            elif m == 40:
                active.append("sp12")
            elif m == 45: # overlap when sp8 starts before sp3 fully departs
                active.append("sp3")
            elif m == 52:
                active.append("sp13")
            elif m == 60: # overlap when sp9 starts before sp5 departs
                active.append("sp5")
            elif m == 68:
                active.append("sp14")
            elif m == 76:
                active.append("sp15")
            elif m == 80:
                active.append("sp16")
                
    staff_counts.append(count)
    
    # 2. Generate sales for active people
    month_sales = 0
    # Seasonality factor (high in winter Nov-Dec and festival seasons around month%12)
    # 12-month cycle: peak around Oct/Nov/Dec (indices 10, 11, 12)
    month_mod = m % 12
    season_mult = 1.0 + 0.25 * np.sin(2 * np.pi * (month_mod - 8) / 12)
    
    # Check special prompt cases:
    # Month 1 ramp up: sales ~$23k
    # Months 74-75 drop: $96k -> $61k
    # Month 76 with 8 staff: $130k
    if m == 1:
        # Month 1 ramp up
        sales_vals = {"sp1": 9500.0, "sp2": 8200.0, "sp3": 5300.0}
        for k, v in sales_vals.items():
            data[k][m-1] = v
        month_sales = sum(sales_vals.values())
    elif m == 74:
        # Drop to 96k
        sales_pool = {
            "sp1": 16100.0, "sp2": 15800.0, "sp4": 17200.0, "sp6": 15000.0, 
            "sp7": 14700.0, "sp8": 13900.0, "sp9": 3300.0 # sp9 is a lower performer
        }
        for k, v in sales_pool.items():
            data[k][m-1] = v
        month_sales = sum(sales_pool.values())
    elif m == 75:
        # Drop to 61k (heavy summer/monsoon slump or staff issues)
        sales_pool = {
            "sp1": 11000.0, "sp2": 10500.0, "sp4": 11500.0, "sp6": 9800.0, 
            "sp7": 9200.0, "sp8": 8000.0, "sp9": 1000.0
        }
        for k, v in sales_pool.items():
            data[k][m-1] = v
        month_sales = sum(sales_pool.values())
    elif m == 76:
        # 8 staff jump to 130k (festival + recruit overlap)
        sales_pool = {
            "sp1": 21000.0, "sp2": 20400.0, "sp4": 22000.0, "sp6": 19500.0, 
            "sp7": 19000.0, "sp8": 18200.0, "sp9": 6500.0, "sp15": 3400.0 # sp15 is weak new hire
        }
        for k, v in sales_pool.items():
            data[k][m-1] = v
        month_sales = sum(sales_pool.values())
    else:
        # Standard month generation
        for act in active:
            # Base sales per staff category
            if act in ["sp1", "sp2"]:
                base = 13400.0 if act == "sp1" else 13200.0
                std = 1200.0
            elif act == "sp4":
                base = 14000.0
                std = 1500.0
            elif act == "sp3":
                base = 12500.0
                std = 1100.0
            elif act in ["sp5", "sp6", "sp7", "sp8", "sp9"]:
                # Normal staff
                base = 11500.0 if act == "sp6" else 11000.0
                if act == "sp5": base = 11800.0
                if act == "sp7": base = 10800.0
                if act == "sp8": base = 10500.0
                if act == "sp9": base = 9000.0 # slightly weaker mid-term replacement
                std = 1000.0
            elif act in ["sp10", "sp11", "sp12"]:
                # Mid-tier overlapping helpers
                base = 7500.0
                std = 800.0
            else:
                # Late weak hires sp13, sp14, sp15, sp16 (well under 5k)
                base = 3200.0 if act == "sp13" else 3500.0
                if act == "sp15": base = 3100.0
                if act == "sp16": base = 2800.0
                std = 500.0
                
            # Apply seasonality and random noise
            val = max(0.0, np.round(base * season_mult + np.random.normal(0, std)))
            data[act][m-1] = val
            month_sales += val
            
    total_sales.append(np.round(month_sales, 2))

# Assemble DataFrame
df = pd.DataFrame(data)
df.insert(0, "Month", months)
df.insert(1, "Staff_Count", staff_counts)
df.insert(2, "Total_Sales", total_sales)

# Add some outliers and anomalies to make validation engine look realistic:
# Let's add a negative sales somewhere: salesperson 10 in month 35 (not active, but let's make it -500.0 as a typo)
df.at[34, "sp10"] = -500.0
# Let's add a missing value somewhere representable as empty/NaN (salesperson 5 in Month 12 is blank instead of 0)
df.at[11, "sp5"] = np.nan
# Highlight outlier: Month 50 Salesperson 1 gets an absolute spike (typo, extra zero)
df.at[49, "sp1"] = 134000.0 # Typo: 13.4k became 134k!
df.at[49, "Total_Sales"] = df.iloc[49, 3:].sum(min_count=1)

# Save to CSV
df.to_csv("mall_store_sales.csv", index=False)
print(" Procedural CSV dataset generated at 'mall_store_sales.csv' successfully with outliers, drops, and rampups!")
