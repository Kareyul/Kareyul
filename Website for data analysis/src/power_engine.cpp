#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <iomanip>

struct PowerRecord {
    int year;
    long long biomass;
    long long coal;
    long long geothermal;
    long long hydro;
    long long natural_gas;
    long long oil_based;
    long long solar;
    long long wind;
    long long grand_total;
    long long re_total;
    long long fossil_total;
    double re_share_pct;
};

std::vector<std::string> parse_csv_line(const std::string& line) {
    std::vector<std::string> result;
    std::string cell;
    bool in_quotes = false;
    for (size_t i = 0; i < line.size(); ++i) {
        char c = line[i];
        if (c == '"') {
            in_quotes = !in_quotes;
        } else if (c == ',' && !in_quotes) {
            result.push_back(cell);
            cell.clear();
        } else {
            cell.push_back(c);
        }
    }
    result.push_back(cell);
    return result;
}

std::vector<PowerRecord> load_data(const std::string& path) {
    std::vector<PowerRecord> records;
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << path << std::endl;
        return records;
    }

    std::string line;
    // Skip header line
    if (std::getline(file, line)) {
        // Headers: Years,Biomass,Coal,Geothermal,Hydro,Natural Gas,Oil-based,Solar,Wind,Grand Total,RE_Total,Fossil_Total,RE_Share_Pct
    }

    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::vector<std::string> cols = parse_csv_line(line);
        if (cols.size() < 13) continue;

        PowerRecord r;
        try {
            r.year = std::stoi(cols[0]);
            r.biomass = std::stoll(cols[1]);
            r.coal = std::stoll(cols[2]);
            r.geothermal = std::stoll(cols[3]);
            r.hydro = std::stoll(cols[4]);
            r.natural_gas = std::stoll(cols[5]);
            r.oil_based = std::stoll(cols[6]);
            r.solar = std::stoll(cols[7]);
            r.wind = std::stoll(cols[8]);
            r.grand_total = std::stoll(cols[9]);
            r.re_total = std::stoll(cols[10]);
            r.fossil_total = std::stoll(cols[11]);
            r.re_share_pct = std::stod(cols[12]);
        } catch (...) {
            continue; // Skip invalid rows
        }
        records.push_back(r);
    }
    return records;
}

void print_summary(const std::vector<PowerRecord>& records) {
    std::stringstream ss;
    ss << "{\n";
    ss << "  \"records\": [\n";
    bool first = true;
    for (const auto& r : records) {
        if (!first) ss << ",\n";
        ss << "    {\n"
           << "      \"year\": " << r.year << ",\n"
           << "      \"biomass\": " << r.biomass << ",\n"
           << "      \"coal\": " << r.coal << ",\n"
           << "      \"geothermal\": " << r.geothermal << ",\n"
           << "      \"hydro\": " << r.hydro << ",\n"
           << "      \"natural_gas\": " << r.natural_gas << ",\n"
           << "      \"oil_based\": " << r.oil_based << ",\n"
           << "      \"solar\": " << r.solar << ",\n"
           << "      \"wind\": " << r.wind << ",\n"
           << "      \"grand_total\": " << r.grand_total << ",\n"
           << "      \"re_total\": " << r.re_total << ",\n"
           << "      \"fossil_total\": " << r.fossil_total << ",\n"
           << "      \"re_share_pct\": " << std::fixed << std::setprecision(4) << r.re_share_pct << "\n"
           << "    }";
        first = false;
    }
    ss << "\n  ]\n";
    ss << "}";
    std::cout << ss.str() << std::endl;
}

void print_year(const std::vector<PowerRecord>& records, int target_year) {
    const PowerRecord* found = nullptr;
    for (const auto& r : records) {
        if (r.year == target_year) {
            found = &r;
            break;
        }
    }

    if (!found) {
        std::cout << "{\"error\": \"Year " << target_year << " not found in dataset\"}" << std::endl;
        return;
    }

    std::stringstream ss;
    ss << "{\n"
       << "  \"year\": " << found->year << ",\n"
       << "  \"grand_total\": " << found->grand_total << ",\n"
       << "  \"re_total\": " << found->re_total << ",\n"
       << "  \"fossil_total\": " << found->fossil_total << ",\n"
       << "  \"re_share_pct\": " << std::fixed << std::setprecision(4) << found->re_share_pct << ",\n"
       << "  \"sources\": [\n"
       << "    {\"name\": \"Biomass\", \"count\": " << found->biomass << "},\n"
       << "    {\"name\": \"Coal\", \"count\": " << found->coal << "},\n"
       << "    {\"name\": \"Geothermal\", \"count\": " << found->geothermal << "},\n"
       << "    {\"name\": \"Hydro\", \"count\": " << found->hydro << "},\n"
       << "    {\"name\": \"Natural Gas\", \"count\": " << found->natural_gas << "},\n"
       << "    {\"name\": \"Oil-based\", \"count\": " << found->oil_based << "},\n"
       << "    {\"name\": \"Solar\", \"count\": " << found->solar << "},\n"
       << "    {\"name\": \"Wind\", \"count\": " << found->wind << "}\n"
       << "  ]\n"
       << "}";
    std::cout << ss.str() << std::endl;
}

int main(int argc, char* argv[]) {
    std::string csv_path = "data/cleaned_power.csv";
    std::string mode = "";
    int target_year = -1;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--summary") {
            mode = "summary";
        } else if (arg == "--year" && i + 1 < argc) {
            mode = "year";
            try {
                target_year = std::stoi(argv[++i]);
            } catch (...) {
                std::cout << "{\"error\": \"Invalid year parameter\"}" << std::endl;
                return 1;
            }
        } else if (arg == "--data" && i + 1 < argc) {
            csv_path = argv[++i];
        }
    }

    std::vector<PowerRecord> records = load_data(csv_path);
    if (records.empty()) {
        std::cout << "{\"error\": \"Failed to load power data from " << csv_path << "\"}" << std::endl;
        return 1;
    }

    if (mode == "summary") {
        print_summary(records);
    } else if (mode == "year") {
        print_year(records, target_year);
    } else {
        std::cout << "{\"error\": \"Invalid mode. Use --summary or --year Y\"}" << std::endl;
        return 1;
    }

    return 0;
}
