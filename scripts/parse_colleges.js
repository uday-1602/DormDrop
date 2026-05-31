import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const csvPath = path.resolve('colleges.csv');
const outputPath = path.resolve('src/constants.js');

const run = () => {
    console.log("Reading colleges.csv...");
    if (!fs.existsSync(csvPath)) {
        console.error(`Error: colleges.csv not found at ${csvPath}`);
        process.exit(1);
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    console.log("Parsing CSV content...");
    const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true
    });
    
    const collegesSet = new Set();
    
    // Top-tier and originally curated colleges to preserve
    const originalColleges = [
        'IIT Bombay, Mumbai', 'IIT Delhi, New Delhi', 'IIT Madras, Chennai', 'IIT Kanpur, Kanpur', 
        'IIT Kharagpur, Kharagpur', 'IIT Roorkee, Roorkee', 'IIT Guwahati, Guwahati', 
        'IIT Hyderabad, Sangareddy', 'IIT Indore, Indore', 'IIT Varanasi (BHU), Varanasi', 
        'IIT Gandhinagar, Gandhinagar', 'IIT Ropar, Rupnagar', 'IIT Bhubaneswar, Bhubaneswar', 
        'IIT Jodhpur, Jodhpur', 'IIT Patna, Patna', 'IIT Mandi, Mandi', 'IIT Tirupati, Tirupati', 
        'IIT Palakkad, Palakkad', 'IIT Goa, Ponda', 'IIT Bhilai, Raipur', 'IIT Dharwad, Dharwad', 
        'IIT Jammu, Jammu', 'ISM Dhanbad, Dhanbad',
        'NIT Agartala, Agartala', 'NIT Allahabad (MNNIT), Allahabad', 'NIT Andhra Pradesh, Tadepalligudem', 
        'NIT Arunachal Pradesh, Yupia', 'NIT Bhopal (MANIT), Bhopal', 'NIT Calicut, Kozhikode', 
        'NIT Delhi, New Delhi', 'NIT Durgapur, Durgapur', 'NIT Goa, Ponda', 'NIT Hamirpur, Hamirpur', 
        'NIT Jaipur (MNIT), Jaipur', 'NIT Jalandhar, Jalandhar', 'NIT Jamshedpur, Jamshedpur', 
        'NIT Kurukshetra, Kurukshetra', 'NIT Manipur, Imphal', 'NIT Meghalaya, Shillong', 
        'NIT Mizoram, Aizawl', 'NIT Nagaland, Chumukedima', 'NIT Nagpur (VNIT), Nagpur', 
        'NIT Patna, Patna', 'NIT Puducherry, Karaikal', 'NIT Raipur, Raipur', 'NIT Rourkela, Rourkela', 
        'NIT Sikkim, Ravangla', 'NIT Silchar, Silchar', 'NIT Srinagar, Srinagar', 
        'NIT Surathkal, Mangalore', 'NIT Trichy, Trichy', 'NIT Uttarakhand, Srinagar (Garhwal)', 
        'NIT Warangal, Warangal', 'IIIT Allahabad, Allahabad', 'IIIT Bangalore, Bangalore', 
        'IIIT Delhi, New Delhi', 'IIIT Hyderabad, Hyderabad', 'IIITDM Jabalpur, Jabalpur', 
        'IIITDM Kancheepuram, Chennai', 'ABV-IIITM Gwalior, Gwalior', 'IIIT Pune, Pune', 
        'IIIT Lucknow, Lucknow', 'IIIT Sonepat, Sonepat', 'IIIT Kota, Kota', 'IIIT Guwahati, Guwahati', 
        'IIIT Vadodara, Vadodara', 'IIIT Sri City, Sri City', 'IIIT Nagpur, Nagpur', 
        'IIIT Una, Una', 'IIIT Dharwad, Dharwad', 'IIIT Bhagalpur, Bhagalpur', 'IIIT Bhopal, Bhopal', 
        'IIIT Surat, Surat', 'IIIT Ranchi, Ranchi', 'COEP Technological University, Pune', 
        'Delhi Technological University (DTU), Delhi', 'BITS Pilani, Pilani', 'BITS Goa, Zuarinagar', 
        'BITS Hyderabad, Hyderabad', 'VIT Vellore, Vellore', 'VIT Chennai, Chennai', 
        'VIT Bhopal, Bhopal', 'SRM Institute of Science and Technology, Chennai', 
        'SRM University Sonepat, Sonepat', 'Manipal Academy of Higher Education, Manipal',
        'Amity University, Noida', 'Thapar Institute of Engineering and Technology, Patiala', 
        'Symbiosis International University, Pune', 'Christ University, Bangalore', 
        'Chandigarh University, Mohali', 'Lovely Professional University, Phagwara', 
        'Kalinga Institute of Industrial Technology (KIIT), Bhubaneswar', 'Shiv Nadar University, Dadri', 
        'Ashoka University, Sonepat', 'O.P. Jindal Global University, Sonepat', 'FLAME University, Pune', 
        'Azim Premji University, Bangalore', 'Plaksha University, Mohali', 'BML Munjal University, Gurgaon', 
        'GD Goenka University, Gurgaon', 'Birla Institute of Technology Mesra (BIT Mesra), Ranchi', 
        'NMIMS Mumbai, Mumbai', 'ICFAI University, Hyderabad', 'Jain University, Bangalore', 
        'Hindustan Institute of Technology and Science, Chennai', 'Vel Tech University, Chennai', 
        'Karunya Institute of Technology, Coimbatore', 'Bannari Amman Institute of Technology, Sathyamangalam',
        'MIT WPU, Pune', 'MIT ADT, Pune', 'Gautam Buddha University, Greater Noida'
    ];

    for (const c of originalColleges) {
        collegesSet.add(c);
    }

    console.log("Formatting and cleaning data...");
    parsed.data.forEach(row => {
        const name = row['Name of the college'] || row['Name'];
        const district = row['District'];
        const state = row['State'];
        
        if (!name) return;
        
        const trimmedName = name.trim();
        const trimmedDistrict = district ? district.trim() : '';
        const trimmedState = state ? state.trim() : '';
        
        // Skip header duplicates or invalid names
        if (trimmedName.length < 3 || trimmedName.toLowerCase().includes('name of the college')) {
            return;
        }
        
        // Choose either district (city) or state
        const location = trimmedDistrict || trimmedState;
        if (!location) return;
        
        let cleanName = trimmedName
            .replace(/\s+/g, ' ')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'");
            
        let cleanLoc = location
            .replace(/\s+/g, ' ')
            .replace(/[“”]/g, '"')
            .replace(/[‘’]/g, "'");

        // Format: "College Name, Location"
        // Avoid duplicate suffix (e.g. if the name already ends with the location)
        if (cleanName.toLowerCase().endsWith(`, ${cleanLoc.toLowerCase()}`)) {
            collegesSet.add(cleanName);
        } else if (cleanName.toLowerCase().endsWith(` ${cleanLoc.toLowerCase()}`)) {
            collegesSet.add(`${cleanName.slice(0, cleanName.length - cleanLoc.length).trim()}, ${cleanLoc}`);
        } else {
            collegesSet.add(`${cleanName}, ${cleanLoc}`);
        }
    });

    const sortedColleges = Array.from(collegesSet).sort((a, b) => a.localeCompare(b));
    console.log(`Writing ${sortedColleges.length} formatted colleges to constants.js...`);
    
    // Construct the constants file
    let content = `export const colleges = [\n`;
    sortedColleges.forEach(col => {
        const escaped = col.replace(/'/g, "\\'");
        content += `    '${escaped}',\n`;
    });
    content += `];\n\n`;
    
    content += `export const CATEGORIES = [\n`;
    content += `    { name: 'Categories', value: '' },\n`;
    content += `    { name: 'Clothes', value: 'clothes' },\n`;
    content += `    { name: 'Mobiles & Laptops', value: 'mobiles_laptops' },\n`;
    content += `    { name: 'Electronics', value: 'electronics' },\n`;
    content += `    { name: 'Furniture', value: 'furniture' },\n`;
    content += `    { name: 'Books', value: 'books' },\n`;
    content += `    { name: 'Sports', value: 'sports' },\n`;
    content += `    { name: 'Vehicles', value: 'vehicles' },\n`;
    content += `    { name: 'Accessories', value: 'accessories' },\n`;
    content += `    { name: 'Stationery', value: 'stationery' },\n`;
    content += `    { name: 'Musical Instruments', value: 'instruments' }\n`;
    content += `];\n`;
    
    fs.writeFileSync(outputPath, content, 'utf8');
    console.log("Success! Constants file updated.");
};

run();
