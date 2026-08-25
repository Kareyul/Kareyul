#include <iostream>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <iomanip>

struct Record {
    std::string region;
    std::string province;
    std::string municipality;
    int year;
    int count;
};

// Robust CSV parser that handles double quotes
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

// Function to escape strings for JSON output
std::string escape_json(const std::string& s) {
    std::ostringstream o;
    for (char c : s) {
        if (c == '"') o << "\\\"";
        else if (c == '\\') o << "\\\\";
        else if (c == '\b') o << "\\b";
        else if (c == '\f') o << "\\f";
        else if (c == '\n') o << "\\n";
        else if (c == '\r') o << "\\r";
        else if (c == '\t') o << "\\t";
        else o << c;
    }
    return o.str();
}

std::vector<Record> load_data(const std::string& path) {
    std::vector<Record> records;
    std::ifstream file(path);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << path << std::endl;
        return records;
    }

    std::string line;
    // Skip header line
    if (std::getline(file, line)) {
        // Headers: Region,Province,Municipality,Year,Count
    }

    while (std::getline(file, line)) {
        if (line.empty()) continue;
        std::vector<std::string> cols = parse_csv_line(line);
        if (cols.size() < 5) continue;

        Record r;
        r.region = cols[0];
        r.province = cols[1];
        r.municipality = cols[2];
        try {
            r.year = std::stoi(cols[3]);
            r.count = std::stoi(cols[4]);
        } catch (...) {
            continue; // Skip invalid rows
        }
        records.push_back(r);
    }
    return records;
}

// Helper to calculate total emigrant count
long long get_national_total(const std::vector<Record>& records) {
    long long total = 0;
    for (const auto& r : records) {
        total += r.count;
    }
    return total;
}

// Helper to generate filters JSON
void print_filters(const std::vector<Record>& records) {
    // We want to collect:
    // - list of regions
    // - region -> set of provinces
    // - province -> set of municipalities
    std::set<std::string> regions;
    std::map<std::string, std::set<std::string>> region_to_provinces;
    std::map<std::string, std::set<std::string>> province_to_municipalities;

    for (const auto& r : records) {
        regions.insert(r.region);
        region_to_provinces[r.region].insert(r.province);
        province_to_municipalities[r.province].insert(r.municipality);
    }

    std::stringstream ss;
    ss << "{\n";
    
    // Regions list
    ss << "  \"regions\": [\n";
    bool first_reg = true;
    for (const auto& reg : regions) {
        if (!first_reg) ss << ",\n";
        ss << "    \"" << escape_json(reg) << "\"";
        first_reg = false;
    }
    ss << "\n  ],\n";

    // Region -> Provinces mapping
    ss << "  \"region_provinces\": {\n";
    bool first_rp = true;
    for (const auto& pair : region_to_provinces) {
        if (!first_rp) ss << ",\n";
        ss << "    \"" << escape_json(pair.first) << "\": [\n";
        bool first_p = true;
        for (const auto& prov : pair.second) {
            if (!first_p) ss << ",\n";
            ss << "      \"" << escape_json(prov) << "\"";
            first_p = false;
        }
        ss << "\n    ]";
        first_rp = false;
    }
    ss << "\n  },\n";

    // Province -> Municipalities mapping
    ss << "  \"province_municipalities\": {\n";
    bool first_pm = true;
    for (const auto& pair : province_to_municipalities) {
        if (!first_pm) ss << ",\n";
        ss << "    \"" << escape_json(pair.first) << "\": [\n";
        bool first_m = true;
        for (const auto& muni : pair.second) {
            if (!first_m) ss << ",\n";
            ss << "      \"" << escape_json(muni) << "\"";
            first_m = false;
        }
        ss << "\n    ]";
        first_pm = false;
    }
    ss << "\n  }\n";
    
    ss << "}";
    std::cout << ss.str() << std::endl;
}

// Helper to generate national summary JSON
void print_summary(const std::vector<Record>& records) {
    long long national_total = get_national_total(records);
    
    // Yearly sums
    std::map<int, long long> yearly_sums;
    for (int y = 1988; y <= 2020; ++y) {
        yearly_sums[y] = 0;
    }
    for (const auto& r : records) {
        yearly_sums[r.year] += r.count;
    }

    // Top Regions
    std::map<std::string, long long> reg_sums;
    for (const auto& r : records) {
        reg_sums[r.region] += r.count;
    }
    std::vector<std::pair<std::string, long long>> top_regions(reg_sums.begin(), reg_sums.end());
    std::sort(top_regions.begin(), top_regions.end(), [](const std::pair<std::string, long long>& a, const std::pair<std::string, long long>& b) {
        return a.second > b.second;
    });

    // Top Provinces
    std::map<std::string, long long> prov_sums;
    for (const auto& r : records) {
        if (r.province != "UNKNOWN" && r.province != "NOT REPORTED") {
            prov_sums[r.province] += r.count;
        }
    }
    std::vector<std::pair<std::string, long long>> top_provinces(prov_sums.begin(), prov_sums.end());
    std::sort(top_provinces.begin(), top_provinces.end(), [](const std::pair<std::string, long long>& a, const std::pair<std::string, long long>& b) {
        return a.second > b.second;
    });

    std::stringstream ss;
    ss << "{\n";
    ss << "  \"total\": " << national_total << ",\n";
    
    // Yearly Trend
    ss << "  \"trend\": [\n";
    bool first_t = true;
    for (const auto& pair : yearly_sums) {
        if (!first_t) ss << ",\n";
        ss << "    {\"year\": " << pair.first << ", \"count\": " << pair.second << "}";
        first_t = false;
    }
    ss << "\n  ],\n";

    // Top Regions
    ss << "  \"top_regions\": [\n";
    bool first_r = true;
    for (size_t i = 0; i < std::min(top_regions.size(), size_t(10)); ++i) {
        if (!first_r) ss << ",\n";
        ss << "    {\"name\": \"" << escape_json(top_regions[i].first) << "\", \"count\": " << top_regions[i].second << "}";
        first_r = false;
    }
    ss << "\n  ],\n";

    // Top Provinces
    ss << "  \"top_provinces\": [\n";
    bool first_p = true;
    for (size_t i = 0; i < std::min(top_provinces.size(), size_t(10)); ++i) {
        if (!first_p) ss << ",\n";
        ss << "    {\"name\": \"" << escape_json(top_provinces[i].first) << "\", \"count\": " << top_provinces[i].second << "}";
        first_r = false; // wait, bug fix: first_p
        first_p = false;
    }
    ss << "\n  ]\n";
    ss << "}";

    std::cout << ss.str() << std::endl;
}

// Main query handler
void run_query(const std::vector<Record>& records, const std::string& reg, const std::string& prov, const std::string& muni) {
    long long national_total = get_national_total(records);
    long long query_total = 0;
    
    // Yearly trend mapping for results
    std::map<int, long long> trend;
    for (int y = 1988; y <= 2020; ++y) {
        trend[y] = 0;
    }

    // Accumulators for ranking inside selection
    std::map<std::string, long long> sub_muni_sums;
    std::map<std::string, long long> sub_prov_sums;
    std::map<std::string, long long> sub_reg_sums;

    for (const auto& r : records) {
        // Apply filters (case-insensitive checks, but strings are capitalized)
        bool reg_match = (reg == "ALL" || r.region == reg);
        bool prov_match = (prov == "ALL" || r.province == prov);
        bool muni_match = (muni == "ALL" || r.municipality == muni);

        if (reg_match && prov_match && muni_match) {
            query_total += r.count;
            trend[r.year] += r.count;
            
            sub_muni_sums[r.municipality] += r.count;
            sub_prov_sums[r.province] += r.count;
            sub_reg_sums[r.region] += r.count;
        }
    }

    // Sort rankings
    std::vector<std::pair<std::string, long long>> sorted_munis(sub_muni_sums.begin(), sub_muni_sums.end());
    std::sort(sorted_munis.begin(), sorted_munis.end(), [](const std::pair<std::string, long long>& a, const std::pair<std::string, long long>& b) {
        return a.second > b.second;
    });

    std::vector<std::pair<std::string, long long>> sorted_provs(sub_prov_sums.begin(), sub_prov_sums.end());
    std::sort(sorted_provs.begin(), sorted_provs.end(), [](const std::pair<std::string, long long>& a, const std::pair<std::string, long long>& b) {
        return a.second > b.second;
    });

    double share = (double)query_total / national_total * 100.0;

    std::stringstream ss;
    ss << "{\n";
    ss << "  \"total\": " << query_total << ",\n";
    ss << "  \"share\": " << std::fixed << std::setprecision(5) << share << ",\n";
    
    // Trend output
    ss << "  \"trend\": [\n";
    bool first_t = true;
    for (const auto& pair : trend) {
        if (!first_t) ss << ",\n";
        ss << "    {\"year\": " << pair.first << ", \"count\": " << pair.second << "}";
        first_t = false;
    }
    ss << "\n  ],\n";

    // Top Municipalities inside selection
    ss << "  \"top_municipalities\": [\n";
    bool first_m = true;
    int printed_munis = 0;
    for (const auto& pair : sorted_munis) {
        if (pair.first == "NOT REPORTED") continue;
        if (printed_munis >= 15) break;
        if (!first_m) ss << ",\n";
        ss << "    {\"name\": \"" << escape_json(pair.first) << "\", \"count\": " << pair.second << "}";
        first_m = false;
        printed_munis++;
    }
    ss << "\n  ],\n";

    // Top Provinces inside selection
    ss << "  \"top_provinces\": [\n";
    bool first_p = true;
    int printed_provs = 0;
    for (const auto& pair : sorted_provs) {
        if (pair.first == "UNKNOWN" || pair.first == "NOT REPORTED") continue;
        if (printed_provs >= 10) break;
        if (!first_p) ss << ",\n";
        ss << "    {\"name\": \"" << escape_json(pair.first) << "\", \"count\": " << pair.second << "}";
        first_p = false;
        printed_provs++;
    }
    ss << "\n  ]\n";

    ss << "}";
    std::cout << ss.str() << std::endl;
}

int main(int argc, char* argv[]) {
    std::string csv_path = "data/cleaned_emigrants.csv";
    
    // Simple command-line args processing
    std::string mode = "";
    std::string reg = "ALL";
    std::string prov = "ALL";
    std::string muni = "ALL";

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--summary") {
            mode = "summary";
        } else if (arg == "--filters") {
            mode = "filters";
        } else if (arg == "--query") {
            mode = "query";
        } else if (arg == "--region" && i + 1 < argc) {
            reg = argv[++i];
        } else if (arg == "--province" && i + 1 < argc) {
            prov = argv[++i];
        } else if (arg == "--municipality" && i + 1 < argc) {
            muni = argv[++i];
        } else if (arg == "--data" && i + 1 < argc) {
            csv_path = argv[++i];
        }
    }

    std::vector<Record> records = load_data(csv_path);
    if (records.empty()) {
        std::cout << "{\"error\": \"Failed to load dataset from " << csv_path << "\"}" << std::endl;
        return 1;
    }

    if (mode == "summary") {
        print_summary(records);
    } else if (mode == "filters") {
        print_filters(records);
    } else if (mode == "query") {
        run_query(records, reg, prov, muni);
    } else {
        std::cout << "{\"error\": \"Invalid mode. Use --summary, --filters, or --query\"}" << std::endl;
        return 1;
    }

    return 0;
}
