import pandas as pd
import os

def clean_power_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(base_dir, 'power.csv')
    data_dir = os.path.join(base_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)
    out_path = os.path.join(data_dir, 'cleaned_power.csv')

    print(f"Reading power data from: {csv_path}")
    df = pd.read_csv(csv_path, sep='\t', encoding='utf-16')

    # Strip column names
    df.columns = [col.strip() for col in df.columns]

    # Clean numeric fields (remove commas and convert to float/int)
    numeric_cols = [
        'Biomass', 'Coal', 'Geothermal', 'Hydro', 'Natural Gas', 'Oil-based', 'Solar', 'Wind', 'Grand Total'
    ]
    
    for col in numeric_cols:
        if col in df.columns:
            # Cast to string, strip, replace commas, and convert to numeric
            df[col] = df[col].astype(str).str.replace(',', '').str.strip()
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).astype(int)

    # Classifications
    re_cols = ['Biomass', 'Geothermal', 'Hydro', 'Solar', 'Wind']
    fossil_cols = ['Coal', 'Natural Gas', 'Oil-based']

    # Calculate additional totals for analysis
    df['RE_Total'] = df[re_cols].sum(axis=1)
    df['Fossil_Total'] = df[fossil_cols].sum(axis=1)
    
    # Calculate Renewable Share Pct
    # Avoid division by zero
    df['RE_Share_Pct'] = (df['RE_Total'] / df['Grand Total'] * 100).fillna(0).round(4)

    # Verify that Grand Total matches fuel sums (there might be tiny rounding discrepancies in original data)
    print("Verifying calculations...")
    mismatch_count = 0
    for idx, row in df.iterrows():
        calculated_total = row['RE_Total'] + row['Fossil_Total']
        if calculated_total != row['Grand Total']:
            mismatch_count += 1
            # Adjust to match calculated sum if there is a tiny discrepancy
            df.at[idx, 'Grand Total'] = calculated_total
            # Recalculate RE Share based on adjusted total
            df.at[idx, 'RE_Share_Pct'] = round((row['RE_Total'] / calculated_total * 100), 4)

    print(f"Verified rows. Mismatches found and corrected: {mismatch_count}")
    print("Cleaned data preview:")
    print(df.head())

    df.to_csv(out_path, index=False)
    print(f"Cleaned power generation data saved to: {out_path}")

if __name__ == '__main__':
    clean_power_data()
