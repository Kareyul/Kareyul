import pandas as pd
import re
import os

def clean_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    xls_path = os.path.join(base_dir, 'Phil_stat.xls')
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, 'cleaned_emigrants.csv')

    print(f"Reading excel file from: {xls_path}")
    xls = pd.ExcelFile(xls_path, engine='openpyxl')

    # 1. Parse PROVINCE sheet to get Province -> Region mapping
    print("Parsing PROVINCE sheet to build Region mappings...")
    df_p = pd.read_excel(xls, 'PROVINCE')
    # Header is at row 1 (0-indexed)
    df_p.columns = df_p.iloc[1]
    df_p = df_p.iloc[2:] # Skip headers

    province_to_region = {}
    current_region = None

    def clean_name(n):
        n = str(n).strip()
        # Remove parenthetical and bracketed comments/footnotes
        n = re.sub(r'\s*\(.+?\)\s*', ' ', n)
        n = re.sub(r'\s*\[.+?\]\s*', ' ', n)
        n = re.sub(r'\s+', ' ', n)
        return n.strip().upper()

    for idx, row in df_p.iterrows():
        p_name = row['PROVINCE']
        if pd.isnull(p_name):
            continue
        p_str = str(p_name).strip()
        
        # Skip totals, notes and footnotes
        if p_str in ['TOTAL', 'GRAND TOTAL', 'Notes:', 'Not Reported/No Response', 'Sub-Total National Capital Region']:
            continue
        if "Source:" in p_str or "Republic Act" in p_str or "Muslim Mindanao" in p_str or "Isabela City" in p_str:
            continue
            
        years_data = row.iloc[1:-1]
        if years_data.isnull().all():
            current_region = p_str
        else:
            if p_str.startswith('Sub-Total'):
                continue
            prov_clean = clean_name(p_str)
            province_to_region[prov_clean] = current_region

    # Add custom mappings for variations or special districts
    province_to_region['SAMAR'] = 'Region VIII - Eastern Visayas'
    province_to_region['WESTERN SAMAR'] = 'Region VIII - Eastern Visayas'
    province_to_region['NCR FIRST DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR SECOND DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR THIRD DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR FOURTH DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR, FIRST DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR, SECOND DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR, THIRD DISTRICT'] = 'National Capital Region (NCR)'
    province_to_region['NCR, FOURTH DISTRICT'] = 'National Capital Region (NCR)'

    # 2. Parse MUNICIPALITY sheet with state machine
    print("Parsing MUNICIPALITY sheet...")
    df_m = pd.read_excel(xls, 'MUNICIPALITY')
    df_m.columns = df_m.iloc[1]
    df_m = df_m.iloc[2:]

    # Standardize column names (specifically converting years to float/string representation)
    col_names = []
    for col in df_m.columns:
        if pd.isnull(col):
            col_names.append(None)
        else:
            col_names.append(str(col).split('.')[0].strip())
    df_m.columns = col_names

    records = []
    current_prov = None
    current_reg = None
    years = [str(y) for y in range(1988, 2021)]

    for idx, row in df_m.iterrows():
        name = row['CITY / MUNICIPALITY']
        if pd.isnull(name):
            continue
        
        name_str = str(name).strip()
        name_upper = name_str.upper()
        
        # Skip grand totals and metadata footers
        if name_upper in ['GRAND TOTAL', 'Not Reported/No Response', 'TOTAL'] or name_upper.startswith('SOURCE:') or name_upper.startswith('NOTES:'):
            continue
        
        # Clean the row name
        p_clean = clean_name(name_str)
        
        # Check if this row is a province header
        years_data = row[years]
        years_numeric = pd.to_numeric(years_data, errors='coerce')
        is_empty = years_numeric.isnull().all() or (years_numeric.fillna(0) == 0).all() or pd.isnull(row['TOTAL'])
        
        if p_clean in province_to_region and is_empty:
            current_prov = p_clean
            current_reg = province_to_region[current_prov]
            continue
            
        muni_name = None
        prov_name = None
        
        # Extract municipality and parent province names
        m1 = re.search(r'^(.+?),\s*\((.+?)\)$', name_str)
        if m1:
            muni_name = m1.group(1).strip().upper()
            prov_name = clean_name(m1.group(2))
        else:
            m2 = re.search(r'^(.+?)\s*\((.+?)\)$', name_str)
            if m2:
                muni_name = m2.group(1).strip().upper()
                prov_name = clean_name(m2.group(2))
            else:
                if name_upper == 'NOT REPORTED' or name_upper == 'NOT STATTED':
                    muni_name = 'NOT REPORTED'
                    prov_name = current_prov
                elif 'CITY' in name_upper:
                    muni_name = name_upper
                    if 'MARAWI' in name_upper:
                        prov_name = 'LANAO DEL SUR'
                    elif 'COTABATO' in name_upper:
                        prov_name = 'MAGUINDANAO'
                    else:
                        prov_name = current_prov
                else:
                    muni_name = name_upper
                    prov_name = current_prov

        if muni_name and prov_name:
            current_prov = prov_name
            current_reg = province_to_region.get(current_prov, current_reg)
            if current_reg is None:
                if "NCR" in current_prov:
                    current_reg = 'National Capital Region (NCR)'
                else:
                    current_reg = 'Unknown'
            
            for yr in years:
                val = row[yr]
                count = 0
                if pd.notnull(val):
                    try:
                        count = int(float(val))
                    except:
                        pass
                if count > 0:
                    records.append({
                        'Region': current_reg,
                        'Province': current_prov,
                        'Municipality': muni_name,
                        'Year': int(yr),
                        'Count': count
                    })

    df_cleaned = pd.DataFrame(records)
    print(f"Generated {len(df_cleaned)} tidy records.")
    
    total_emigrants = df_cleaned['Count'].sum()
    print(f"Total Emigrants in cleaned dataset: {total_emigrants}")
    
    # Grand total verification
    gt_val = 2177920 # Verified Grand Total from original excel
    print(f"Target Grand Total: {gt_val}")
    
    if total_emigrants == gt_val:
        print("SUCCESS: Cleaned emigrants count matches target grand total perfectly!")
    else:
        print(f"WARNING: Count mismatch! Cleaned: {total_emigrants}, Target: {gt_val}")
        
    df_cleaned.to_csv(out_path, index=False)
    print(f"Saved cleaned dataset to: {out_path}")

if __name__ == '__main__':
    clean_data()
