// Global variables to store dropdown data and chart instances
let filtersData = null;
let trendChart = null;
let regionsChart = null;
let provincesChart = null;
let drilldownTrendChart = null;
let drilldownRankingChart = null;

// Power project chart instances
let powerTrendChart = null;
let powerReShareChart = null;
let powerPieChart = null;
let powerBarChart = null;

// DOM Elements - Pages
const pageHome = document.getElementById('page-home');
const pageDashboard = document.getElementById('page-dashboard');
const pagePower = document.getElementById('page-power');

// DOM Elements - Nav Links
const navHome = document.getElementById('nav-home');
const navDashboard = document.getElementById('nav-dashboard');
const navPower = document.getElementById('nav-power');

// DOM Elements - Dashboard Sections
const secOverview = document.getElementById('section-overview');
const secDrilldown = document.getElementById('section-drilldown');
const secInsights = document.getElementById('section-insights');

// DOM Elements - Dashboard Sub-Tabs
const tabOverview = document.getElementById('subtab-overview');
const tabDrilldown = document.getElementById('subtab-drilldown');
const tabInsights = document.getElementById('subtab-insights');

// DOM Elements - Power Sections & Sub-Tabs
const secPowerOverview = document.getElementById('section-power-overview');
const secPowerYearly = document.getElementById('section-power-yearly');
const tabPowerOverview = document.getElementById('subtab-power-overview');
const tabPowerYearly = document.getElementById('subtab-power-yearly');
const selectPowerYear = document.getElementById('select-power-year');

// Dropdowns - Dashboard
const selectRegion = document.getElementById('select-region');
const selectProvince = document.getElementById('select-province');
const selectMunicipality = document.getElementById('select-municipality');

// State tracking for current dashboard selections
let currentRegion = 'ALL';
let currentProvince = 'ALL';
let currentMunicipality = 'ALL';
let emigrantRecords = [];
let powerRecords = [];

function parseCsv(csvText) {
    const lines = csvText.trim().split(/\r?\n/);
    const parseLine = line => {
        const values = [];
        let value = '';
        let quoted = false;
        for (let index = 0; index < line.length; index++) {
            const character = line[index];
            if (character === '"' && line[index + 1] === '"' && quoted) {
                value += '"';
                index++;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (character === ',' && !quoted) {
                values.push(value);
                value = '';
            } else {
                value += character;
            }
        }
        values.push(value);
        return values;
    };
    const headers = parseLine(lines.shift());
    return lines.map(line => {
        const values = parseLine(line);
        return headers.reduce((record, header, index) => {
            record[header] = values[index];
            return record;
        }, {});
    });
}

async function loadStaticEmigrantRecords() {
    if (emigrantRecords.length) return emigrantRecords;
    const response = await fetch('../data/cleaned_emigrants.csv');
    emigrantRecords = parseCsv(await response.text()).map(record => ({
        region: record.Region,
        province: record.Province,
        municipality: record.Municipality,
        year: Number(record.Year),
        count: Number(record.Count)
    }));
    return emigrantRecords;
}

function aggregateEmigrantRecords(records, key) {
    const totals = new Map();
    records.forEach(record => totals.set(record[key], (totals.get(record[key]) || 0) + record.count));
    return [...totals.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

async function getEmigrantData() {
    try {
        const response = await fetch('/api/summary');
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Using static emigrant data:', error.message);
    }
    const records = await loadStaticEmigrantRecords();
    const yearly = aggregateEmigrantRecords(records, 'year').sort((a, b) => a.name - b.name);
    return {
        total: records.reduce((sum, record) => sum + record.count, 0),
        trend: yearly.map(item => ({ year: item.name, count: item.count })),
        top_regions: aggregateEmigrantRecords(records, 'region').slice(0, 10),
        top_provinces: aggregateEmigrantRecords(records, 'province').slice(0, 10)
    };
}

async function getEmigrantFilters() {
    try {
        const response = await fetch('/api/filters');
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Using static emigrant filters:', error.message);
    }
    const records = await loadStaticEmigrantRecords();
    const regions = [...new Set(records.map(record => record.region))].sort();
    const regionProvinces = {};
    const provinceMunicipalities = {};
    records.forEach(record => {
        regionProvinces[record.region] = [...new Set([...(regionProvinces[record.region] || []), record.province])].sort();
        provinceMunicipalities[record.province] = [...new Set([...(provinceMunicipalities[record.province] || []), record.municipality])].sort();
    });
    return { regions, region_provinces: regionProvinces, province_municipalities: provinceMunicipalities };
}

async function getEmigrantQuery() {
    try {
        const params = new URLSearchParams({ region: currentRegion, province: currentProvince, municipality: currentMunicipality });
        const response = await fetch(`/api/query?${params.toString()}`);
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Using static emigrant query:', error.message);
    }
    const records = (await loadStaticEmigrantRecords()).filter(record =>
        (currentRegion === 'ALL' || record.region === currentRegion) &&
        (currentProvince === 'ALL' || record.province === currentProvince) &&
        (currentMunicipality === 'ALL' || record.municipality === currentMunicipality)
    );
    const trend = aggregateEmigrantRecords(records, 'year').sort((a, b) => a.name - b.name);
    const total = records.reduce((sum, record) => sum + record.count, 0);
    const allRecords = await loadStaticEmigrantRecords();
    return {
        total,
        share: allRecords.reduce((sum, record) => sum + record.count, 0) ? total / allRecords.reduce((sum, record) => sum + record.count, 0) * 100 : 0,
        trend: trend.map(item => ({ year: item.name, count: item.count })),
        top_municipalities: currentProvince !== 'ALL' ? aggregateEmigrantRecords(records, 'municipality').slice(0, 10) : [],
        top_provinces: currentRegion !== 'ALL' && currentProvince === 'ALL' ? aggregateEmigrantRecords(records, 'province').slice(0, 10) : []
    };
}

async function loadStaticPowerRecords() {
    if (powerRecords.length) return powerRecords;
    const response = await fetch('../data/cleaned_power.csv');
    powerRecords = parseCsv(await response.text()).map(record => ({
        year: Number(record.Years),
        biomass: Number(record.Biomass),
        coal: Number(record.Coal),
        geothermal: Number(record.Geothermal),
        hydro: Number(record.Hydro),
        natural_gas: Number(record['Natural Gas']),
        oil_based: Number(record['Oil-based']),
        solar: Number(record.Solar),
        wind: Number(record.Wind),
        grand_total: Number(record['Grand Total']),
        re_total: Number(record.RE_Total),
        fossil_total: Number(record.Fossil_Total),
        re_share_pct: Number(record.RE_Share_Pct)
    }));
    return powerRecords;
}

async function getPowerSummary() {
    try {
        const response = await fetch('/api/power/summary');
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Using static power data:', error.message);
    }
    return { records: await loadStaticPowerRecords() };
}

async function getPowerYear(year) {
    try {
        const response = await fetch(`/api/power/query?year=${year}`);
        if (response.ok) return response.json();
    } catch (error) {
        console.warn('Using static power query:', error.message);
    }
    const record = (await loadStaticPowerRecords()).find(item => item.year === Number(year));
    return {
        grand_total: record.grand_total,
        sources: [
            { name: 'Biomass', count: record.biomass },
            { name: 'Coal', count: record.coal },
            { name: 'Geothermal', count: record.geothermal },
            { name: 'Hydro', count: record.hydro },
            { name: 'Natural Gas', count: record.natural_gas },
            { name: 'Oil-based', count: record.oil_based },
            { name: 'Solar', count: record.solar },
            { name: 'Wind', count: record.wind }
        ]
    };
}

// Initialize SPA
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadOverviewData();
    loadFiltersData();
    // Default load drilldown overview stats
    queryDrilldown();
    // Load Power stats
    loadPowerData();

    const initialPage = window.location.hash === '#power' ? 'power' : 'dashboard';
    showPage(initialPage);
});

// Setup tab navigation click listeners
function setupNavigation() {
    // Top Navbar Navigation
    if (navHome) navHome.addEventListener('click', () => showPage('home'));
    if (navDashboard) navDashboard.addEventListener('click', () => showPage('dashboard'));
    if (navPower) navPower.addEventListener('click', () => showPage('power'));
    const dashboardButton = document.getElementById('btn-goto-dashboard');
    const powerButton = document.getElementById('btn-goto-power');
    if (dashboardButton) dashboardButton.addEventListener('click', () => showPage('dashboard'));
    if (powerButton) powerButton.addEventListener('click', () => showPage('power'));

    // Dashboard Sub-tabs (Emigrants)
    if (tabOverview) tabOverview.addEventListener('click', () => showSubTab('overview'));
    if (tabDrilldown) tabDrilldown.addEventListener('click', () => showSubTab('drilldown'));
    if (tabInsights) tabInsights.addEventListener('click', () => showSubTab('insights'));

    // Power Sub-tabs
    if (tabPowerOverview) tabPowerOverview.addEventListener('click', () => showPowerSubTab('overview'));
    if (tabPowerYearly) tabPowerYearly.addEventListener('click', () => showPowerSubTab('yearly'));

    // Dropdown Select Listeners - Emigrants
    if (selectRegion) selectRegion.addEventListener('change', (e) => {
        currentRegion = e.target.value;
        currentProvince = 'ALL';
        currentMunicipality = 'ALL';
        updateProvinceDropdown();
        queryDrilldown();
    });

    if (selectProvince) selectProvince.addEventListener('change', (e) => {
        currentProvince = e.target.value;
        currentMunicipality = 'ALL';
        updateMunicipalityDropdown();
        queryDrilldown();
    });

    if (selectMunicipality) selectMunicipality.addEventListener('change', (e) => {
        currentMunicipality = e.target.value;
        queryDrilldown();
    });

    // Dropdown Select Listeners - Power
    if (selectPowerYear) selectPowerYear.addEventListener('change', (e) => {
        queryPowerYearly(e.target.value);
    });
}

// Page switcher (Home vs Dashboard vs Power)
function showPage(page) {
    const pages = [
        { name: 'home', el: pageHome, btn: navHome },
        { name: 'dashboard', el: pageDashboard, btn: navDashboard },
        { name: 'power', el: pagePower, btn: navPower }
    ];

    pages.filter(p => p.el && p.btn).forEach(p => {
        if (p.name === page) {
            p.el.classList.remove('hidden');
            p.btn.className = "px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 transition-colors";
        } else {
            p.el.classList.add('hidden');
            p.btn.className = "px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors";
        }
    });
}

// Sub-tab switcher in Emigrants Dashboard
function showSubTab(tab) {
    const tabs = [
        { btn: tabOverview, sec: secOverview },
        { btn: tabDrilldown, sec: secDrilldown },
        { btn: tabInsights, sec: secInsights }
    ];

    tabs.forEach(item => {
        if (item.btn.id.includes(tab)) {
            item.btn.className = "border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600";
            item.sec.classList.remove('hidden');
        } else {
            item.btn.className = "border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300";
            item.sec.classList.add('hidden');
        }
    });
}

// Sub-tab switcher in Power Dashboard
function showPowerSubTab(tab) {
    const tabs = [
        { btn: tabPowerOverview, sec: secPowerOverview, name: 'overview' },
        { btn: tabPowerYearly, sec: secPowerYearly, name: 'yearly' }
    ];

    tabs.forEach(item => {
        if (item.name === tab) {
            item.btn.className = "border-b-2 border-blue-500 py-4 px-1 text-sm font-medium text-blue-600";
            item.sec.classList.remove('hidden');
        } else {
            item.btn.className = "border-b-2 border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300";
            item.sec.classList.add('hidden');
        }
    });
}

// Load National Overview Data
async function loadOverviewData() {
    try {
        const data = await getEmigrantData();
        
        if (data.error) {
            console.error(data.error);
            return;
        }

        // Render KPI metrics
        document.getElementById('kpi-total').innerText = Number(data.total).toLocaleString();
        
        const yearsCount = data.trend.length;
        const avg = Math.round(data.total / yearsCount);
        document.getElementById('kpi-avg').innerText = avg.toLocaleString();

        // Calculate peak and lowest
        let peakYear = 0, peakVal = 0;
        let lowestYear = 0, lowestVal = Infinity;
        data.trend.forEach(t => {
            if (t.count > peakVal) {
                peakVal = t.count;
                peakYear = t.year;
            }
            if (t.count < lowestVal) {
                lowestVal = t.count;
                lowestYear = t.year;
            }
        });
        document.getElementById('kpi-peak').innerText = `${peakVal.toLocaleString()} (${peakYear})`;
        document.getElementById('kpi-lowest').innerText = `${lowestVal.toLocaleString()} (${lowestYear})`;

        // Render Charts
        renderOverviewTrendChart(data.trend);
        renderOverviewRankings(data.top_regions, data.top_provinces);

    } catch (e) {
        console.error("Error loading summary stats: ", e);
    }
}

// Render line chart for national trend
function renderOverviewTrendChart(trendData) {
    const ctx = document.getElementById('chart-trend').getContext('2d');
    
    if (trendChart) trendChart.destroy();

    const years = trendData.map(d => d.year);
    const counts = trendData.map(d => d.count);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Registered Emigrants',
                data: counts,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString() }
                }
            }
        }
    });
}

// Render horizontal bar charts for Top Regions & Top Provinces
function renderOverviewRankings(regions, provinces) {
    // Regions Chart
    const ctxReg = document.getElementById('chart-regions').getContext('2d');
    if (regionsChart) regionsChart.destroy();
    
    // Sort ascending for bottom-to-top rendering in horizontal charts
    const sortedReg = [...regions].reverse();
    regionsChart = new Chart(ctxReg, {
        type: 'bar',
        data: {
            labels: sortedReg.map(r => r.name),
            datasets: [{
                data: sortedReg.map(r => r.count),
                backgroundColor: '#10b981',
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { callback: value => value.toLocaleString() } }
            }
        }
    });

    // Provinces Chart
    const ctxProv = document.getElementById('chart-provinces').getContext('2d');
    if (provincesChart) provincesChart.destroy();

    const sortedProv = [...provinces].reverse();
    provincesChart = new Chart(ctxProv, {
        type: 'bar',
        data: {
            labels: sortedProv.map(p => p.name),
            datasets: [{
                data: sortedProv.map(p => p.count),
                backgroundColor: '#6366f1',
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { callback: value => value.toLocaleString() } }
            }
        }
    });
}

// Load Dropdown Hierarchy Filters
async function loadFiltersData() {
    try {
        filtersData = await getEmigrantFilters();

        // Populate regions dropdown
        filtersData.regions.forEach(reg => {
            const opt = document.createElement('option');
            opt.value = reg;
            opt.innerText = reg;
            selectRegion.appendChild(opt);
        });

    } catch (e) {
        console.error("Error loading filters data: ", e);
    }
}

// Update Provinces selector based on Region selection
function updateProvinceDropdown() {
    // Reset Province dropdown
    selectProvince.innerHTML = '<option value="ALL">All Provinces</option>';
    selectProvince.disabled = true;

    // Reset Municipality dropdown
    selectMunicipality.innerHTML = '<option value="ALL">All Municipalities</option>';
    selectMunicipality.disabled = true;

    if (currentRegion === 'ALL' || !filtersData) return;

    const provinces = filtersData.region_provinces[currentRegion];
    if (provinces) {
        provinces.forEach(prov => {
            const opt = document.createElement('option');
            opt.value = prov;
            opt.innerText = prov;
            selectProvince.appendChild(opt);
        });
        selectProvince.disabled = false;
    }
}

// Update Municipalities selector based on Province selection
function updateMunicipalityDropdown() {
    // Reset Municipality dropdown
    selectMunicipality.innerHTML = '<option value="ALL">All Municipalities</option>';
    selectMunicipality.disabled = true;

    if (currentProvince === 'ALL' || !filtersData) return;

    const munis = filtersData.province_municipalities[currentProvince];
    if (munis) {
        munis.forEach(muni => {
            const opt = document.createElement('option');
            opt.value = muni;
            opt.innerText = muni;
            selectMunicipality.appendChild(opt);
        });
        selectMunicipality.disabled = false;
    }
}

// Execute query to get stats for selected geography
async function queryDrilldown() {
    // Set loading indicator
    document.getElementById('drilldown-kpi-total').innerText = 'Loading...';
    document.getElementById('drilldown-kpi-peak').innerText = 'Loading...';
    document.getElementById('drilldown-kpi-share').innerText = 'Loading...';

    // Update Title
    let selectionTitle = 'Analysis: All Regions';
    if (currentRegion !== 'ALL') {
        selectionTitle = `Analysis: ${currentRegion}`;
        if (currentProvince !== 'ALL') {
            selectionTitle += ` > ${currentProvince}`;
            if (currentMunicipality !== 'ALL') {
                selectionTitle += ` > ${currentMunicipality}`;
            }
        }
    }
    document.getElementById('drilldown-title').innerText = selectionTitle;

    try {
        const queryParams = new URLSearchParams({
            region: currentRegion,
            province: currentProvince,
            municipality: currentMunicipality
        });
        
        const data = await getEmigrantQuery();

        // Update KPIs
        document.getElementById('drilldown-kpi-total').innerText = Number(data.total).toLocaleString();
        document.getElementById('drilldown-kpi-share').innerText = `${data.share.toFixed(4)}%`;

        let peakYear = 0, peakVal = 0;
        data.trend.forEach(t => {
            if (t.count > peakVal) {
                peakVal = t.count;
                peakYear = t.year;
            }
        });
        document.getElementById('drilldown-kpi-peak').innerText = peakVal > 0 ? `${peakVal.toLocaleString()} (${peakYear})` : 'N/A';

        // Render trend chart for specific selection
        renderDrilldownTrendChart(data.trend);

        // Render contextual rankings if province is selected but municipality is ALL
        const rankingContainer = document.getElementById('selection-rankings-container');
        if (currentProvince !== 'ALL' && currentMunicipality === 'ALL' && data.top_municipalities.length > 0) {
            rankingContainer.classList.remove('hidden');
            document.getElementById('ranking-title').innerText = `Top Municipalities of Origin in ${currentProvince}`;
            renderDrilldownRankingChart(data.top_municipalities, '#ec4899');
        } else if (currentRegion !== 'ALL' && currentProvince === 'ALL' && data.top_provinces.length > 0) {
            rankingContainer.classList.remove('hidden');
            document.getElementById('ranking-title').innerText = `Top Provinces of Origin in ${currentRegion}`;
            renderDrilldownRankingChart(data.top_provinces, '#8b5cf6');
        } else {
            rankingContainer.classList.add('hidden');
        }

    } catch (e) {
        console.error("Error executing drilldown query: ", e);
    }
}

// Render dynamic drilldown trend chart
function renderDrilldownTrendChart(trendData) {
    const ctx = document.getElementById('chart-drilldown-trend').getContext('2d');
    if (drilldownTrendChart) drilldownTrendChart.destroy();

    const years = trendData.map(d => d.year);
    const counts = trendData.map(d => d.count);

    drilldownTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Registered Emigrants',
                data: counts,
                borderColor: '#f97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                borderWidth: 3,
                fill: true,
                pointBackgroundColor: '#ea580c',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString() }
                }
            }
        }
    });
}

// Render drilldown rankings chart (Top Munis or Top Provinces within selection)
function renderDrilldownRankingChart(items, color) {
    const ctx = document.getElementById('chart-drilldown-ranking').getContext('2d');
    if (drilldownRankingChart) drilldownRankingChart.destroy();

    const sortedItems = [...items].reverse();

    drilldownRankingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedItems.map(item => item.name),
            datasets: [{
                data: sortedItems.map(item => item.count),
                backgroundColor: color,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { callback: value => value.toLocaleString() } }
            }
        }
    });
}

// ===================================================================
// ==================== PROJECT 2: POWER GENERATION ===================
// ===================================================================

// Load Power Overview data
async function loadPowerData() {
    try {
        const data = await getPowerSummary();

        if (data.error) {
            console.error("Error from C++ engine:", data.error);
            return;
        }

        const records = data.records;
        if (!records || records.length === 0) return;

        // 1. Calculate and populate KPIs
        const latestRec = records[records.length - 1]; // 2020 record
        document.getElementById('power-kpi-latest').innerText = `${Number(latestRec.grand_total).toLocaleString()} GWh`;
        document.getElementById('power-kpi-re-share').innerText = `${latestRec.re_share_pct.toFixed(2)}%`;

        let peakGen = 0, peakGenYear = 0;
        let peakREShare = 0, peakREShareYear = 0;

        records.forEach(r => {
            if (r.grand_total > peakGen) {
                peakGen = r.grand_total;
                peakGenYear = r.year;
            }
            if (r.re_share_pct > peakREShare) {
                peakREShare = r.re_share_pct;
                peakREShareYear = r.year;
            }
        });

        document.getElementById('power-kpi-peak').innerText = `${Number(peakGen).toLocaleString()} GWh (${peakGenYear})`;
        document.getElementById('power-kpi-peak-re-share').innerText = `${peakREShare.toFixed(2)}% (${peakREShareYear})`;

        // 2. Render Overview Charts
        renderPowerTrendChart(records);
        renderPowerReShareChart(records);

        // 3. Populate Year Dropdown (descending order)
        const selectDropdown = document.getElementById('select-power-year');
        selectDropdown.innerHTML = '';
        
        // Loop backwards from latest record to earliest
        for (let i = records.length - 1; i >= 0; i--) {
            const opt = document.createElement('option');
            opt.value = records[i].year;
            opt.innerText = records[i].year;
            selectDropdown.appendChild(opt);
        }

        // Set default selected option to latest year
        selectDropdown.value = latestRec.year;
        
        // Query details for default year
        queryPowerYearly(latestRec.year);

    } catch (e) {
        console.error("Error loading power summary stats: ", e);
    }
}

// Render trend chart showing Fossil vs RE over time
function renderPowerTrendChart(records) {
    const ctx = document.getElementById('chart-power-trend').getContext('2d');
    if (powerTrendChart) powerTrendChart.destroy();

    const years = records.map(r => r.year);
    const totalGen = records.map(r => r.grand_total);
    const fossilGen = records.map(r => r.fossil_total);
    const reGen = records.map(r => r.re_total);

    powerTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [
                {
                    label: 'Total Generation',
                    data: totalGen,
                    borderColor: '#4b5563',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Fossil Fuels (Coal, Gas, Oil)',
                    data: fossilGen,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                },
                {
                    label: 'Renewables (Hydro, Geo, Solar, Wind, Biomass)',
                    data: reGen,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString() },
                    title: { display: true, text: 'GWh Generated' }
                }
            }
        }
    });
}

// Render line chart for Renewable Energy Share percentage
function renderPowerReShareChart(records) {
    const ctx = document.getElementById('chart-power-re-share').getContext('2d');
    if (powerReShareChart) powerReShareChart.destroy();

    const years = records.map(r => r.year);
    const shares = records.map(r => r.re_share_pct);

    powerReShareChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: years,
            datasets: [{
                label: 'Renewable Share (%)',
                data: shares,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.1,
                pointBackgroundColor: '#2563eb'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: { display: true, text: 'Share percentage (%)' }
                }
            }
        }
    });
}

// Fetch breakdown statistics for selected power year
async function queryPowerYearly(year) {
    try {
        const data = await getPowerYear(year);

        if (data.error) {
            console.error("Yearly Query Error:", data.error);
            return;
        }

        renderPowerYearlyCharts(data);

    } catch (e) {
        console.error("Error executing yearly query: ", e);
    }
}

// Render mix pie and bar charts for target year
function renderPowerYearlyCharts(data) {
    // 1. Pie Chart
    const ctxPie = document.getElementById('chart-power-mix-pie').getContext('2d');
    if (powerPieChart) powerPieChart.destroy();

    const labels = data.sources.map(s => s.name);
    const values = data.sources.map(s => s.count);

    // Fuel source color palette
    const colors = [
        '#84cc16', // Biomass - Lime Green
        '#1f2937', // Coal - Dark Slate
        '#ea580c', // Geothermal - Orange
        '#06b6d4', // Hydro - Cyan
        '#64748b', // Natural Gas - Cool Grey
        '#ef4444', // Oil-based - Red
        '#eab308', // Solar - Yellow
        '#10b981'  // Wind - Emerald
    ];

    powerPieChart = new Chart(ctxPie, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const val = context.raw;
                            const total = data.grand_total;
                            const pct = ((val / total) * 100).toFixed(2);
                            return `${context.label}: ${val.toLocaleString()} GWh (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    // 2. Bar Chart
    const ctxBar = document.getElementById('chart-power-mix-bar').getContext('2d');
    if (powerBarChart) powerBarChart.destroy();

    powerBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => value.toLocaleString() }
                }
            }
        }
    });
}

