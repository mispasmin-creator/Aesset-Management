import React, { createContext, useState, useContext, useEffect } from 'react';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [repairsData, setRepairsData] = useState({});
    const [maintenanceData, setMaintenanceData] = useState({});
    const [specsData, setSpecsData] = useState({});
    
    const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec";
    
    // Comprehensive header to property mapping
    const mapHeaderToProperty = (header) => {
        if (!header) return '';
        
        const mappings = {
            // Main Products Sheet
            'Timestamp': 'timestamp',
            'Serial No': 'serialNo',
            'Product Name': 'productName',
            'Category': 'category',
            'Type': 'type',
            'Brand': 'brand',
            'Model': 'model',
            'SKU': 'sku',
            'Mfg Date': 'mfgDate',
            'Origin': 'origin',
            'Status': 'status',
            'Asset Date': 'assetDate',
            'Invoice No': 'invoiceNo',
            'Cost': 'cost',
            'Qty': 'qty',
            'Supplier': 'supplier',
            'Payment': 'payment',
            'Location': 'location',
            'Department': 'department',
            'Assigned To': 'assignedTo',
            'Responsible': 'responsible',
            'Warranty': 'warranty',
            'AMC': 'amc',
            'Maintenance': 'maintenance',
            'Priority': 'priority',
            'Last Repair': 'lastRepair',
            'Last Cost': 'lastCost',
            'Part Chg?': 'partChg',
            'Part 1': 'part1',
            'Part 2': 'part2',
            'Part 3': 'part3',
            'Part 4': 'part4',
            'Part 5': 'part5',
            'Count': 'count',
            'Total Cost': 'totalCost',
            'Asset Value': 'assetValue',
            'Dep. Method': 'depMethod',
            'Created By': 'createdBy',
            'id': 'id',
            'supplierPhone': 'supplierPhone',
            'supplierEmail': 'supplierEmail',
            'usageType': 'usageType',
            'storageLoc': 'storageLoc',
            'warrantyProvider': 'warrantyProvider',
            'warrantyStart': 'warrantyStart',
            'warrantyEnd': 'warrantyEnd',
            'amcProvider': 'amcProvider',
            'amcStart': 'amcStart',
            'amcEnd': 'amcEnd',
            'serviceContact': 'serviceContact',
            'maintenanceType': 'maintenanceType',
            'frequency': 'frequency',
            'nextService': 'nextService',
            'technician': 'technician',
            'maintenanceNotes': 'maintenanceNotes',
            'depRate': 'depRate',
            'assetLife': 'assetLife',
            'residualValue': 'residualValue',
            'internalNotes': 'internalNotes',
            'usageRemarks': 'usageRemarks',
            'condition': 'condition',
            'updatedBy': 'updatedBy',
            'updatedDate': 'updatedDate',
            'qr_code_url': 'qr_code_url',
            'image_url': 'image_url',
            'tags': 'tags',
            'edition': 'edition',
            
            // Product_Repairs Sheet
            'Product SN': 'productSn',
            'Repair Date': 'repairDate',
            'Repair Cost': 'repairCost',
            'Part Changed': 'partChanged',
            'Technician': 'repairTechnician',
            'Remarks': 'remarks',
            'Created Date': 'createdDate',
            
            // Product_Maintenance Sheet
            'Maintenance Required': 'maintenanceRequired',
            'Maintenance Type': 'maintenanceTypeDetail',
            'Frequency': 'frequencyDetail',
            'Next Service Date': 'nextServiceDate',
            'Notes': 'notes',
            
            // Product_Specs Sheet
            'Spec Name': 'specName',
            'Spec Value': 'specValue'
        };
        
        return mappings[header] || header.toLowerCase().replace(/\s(.)/g, (match, group1) => {
            return group1.toUpperCase();
        }).replace(/[^a-zA-Z0-9]/g, '');
    };
    
    // Fetch all sheets data
    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            console.log('📡 Fetching all data from Google Sheets...');
            
            // Fetch all sheets in parallel
            const [productsRes, repairsRes, maintenanceRes, specsRes] = await Promise.all([
                fetch(`${APP_SCRIPT_URL}?sheet=Products&timestamp=${Date.now()}`),
                fetch(`${APP_SCRIPT_URL}?sheet=Product_Repairs&timestamp=${Date.now()}`),
                fetch(`${APP_SCRIPT_URL}?sheet=Product_Maintenance&timestamp=${Date.now()}`),
                fetch(`${APP_SCRIPT_URL}?sheet=Product_Specs&timestamp=${Date.now()}`)
            ]);
            
            const [productsData, repairsData, maintenanceData, specsData] = await Promise.all([
                productsRes.json(),
                repairsRes.json(),
                maintenanceRes.json(),
                specsRes.json()
            ]);
            
            console.log('✅ All data fetched successfully');
            console.log('Products data:', productsData);
            console.log('Repairs data:', repairsData);
            console.log('Maintenance data:', maintenanceData);
            console.log('Specs data:', specsData);
            
            // Process products data
            if (productsData.success && productsData.data && productsData.data.length > 0) {
                const headers = productsData.data[0] || [];
                const productsRows = productsData.data.slice(1);
                
                console.log('📋 Products headers:', headers);
                console.log('📊 Total products rows:', productsRows.length);
                
                const enhancedProducts = productsRows
                    .filter(row => row && row.length > 0 && row.some(cell => cell && cell !== ''))
                    .map((row, index) => {
                        const product = {
                            id: index + 1,
                            rowIndex: index + 2
                        };
                        
                        headers.forEach((header, colIndex) => {
                            if (header && header.trim() !== '') {
                                const propName = mapHeaderToProperty(header);
                                const value = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                                
                                // Handle numeric fields
                                if (['cost', 'qty', 'lastCost', 'totalCost', 'assetValue', 'count', 'repairCost', 'depRate', 'assetLife', 'residualValue'].includes(propName)) {
                                    const numValue = parseFloat(value) || 0;
                                    product[propName] = numValue;
                                } 
                                // Handle part fields
                                else if (propName.startsWith('part') && propName.match(/part\d/)) {
                                    product[propName] = value;
                                    if (!product.partNames) product.partNames = [];
                                    if (value && value !== '-' && value !== '') {
                                        product.partNames.push(value);
                                    }
                                } 
                                // Handle Yes/No fields
                                else if (['warranty', 'amc', 'maintenance', 'partChg'].includes(propName)) {
                                    product[propName] = value;
                                    // Also create normalized versions
                                    if (propName === 'warranty') product.warrantyAvailable = value;
                                    if (propName === 'partChg') product.partChanged = value;
                                    if (propName === 'maintenance') product.maintenanceRequired = value;
                                }
                                // Handle status field
                                else if (propName === 'status') {
                                    product[propName] = value || 'Active';
                                } 
                                // Default: store as-is
                                else {
                                    product[propName] = value;
                                }
                                
                                // Create aliases for commonly used fields
                                if (propName === 'serialNo') product.sn = value;
                                if (propName === 'lastRepair') product.lastRepairDate = value;
                            }
                        });
                        
                        // Ensure partNames array exists
                        if (!product.partNames) {
                            product.partNames = [
                                product.part1,
                                product.part2,
                                product.part3,
                                product.part4,
                                product.part5
                            ].filter(part => part && part !== '-' && part !== '');
                        }
                        
                        return product;
                    });
                
                console.log(`✅ Processed ${enhancedProducts.length} products`);
                if (enhancedProducts.length > 0) {
                    console.log('Sample product (first):', enhancedProducts[0]);
                    console.log('Sample product keys:', Object.keys(enhancedProducts[0]));
                }
                
                setProducts(enhancedProducts);
                localStorage.setItem('products', JSON.stringify(enhancedProducts));
            } else {
                console.warn('⚠️ No products data found or empty response');
                setProducts([]);
            }
            
            // Process repairs data
            if (repairsData.success && repairsData.data && repairsData.data.length > 0) {
                const repairsByProduct = {};
                const headers = repairsData.data[0] || [];
                const repairsRows = repairsData.data.slice(1);
                
                console.log('🔧 Repairs headers:', headers);
                console.log('🔧 Total repairs rows:', repairsRows.length);
                
                repairsRows
                    .filter(row => row && row.length > 0 && row.some(cell => cell && cell !== ''))
                    .forEach(row => {
                        const sn = row[0]; // Product SN is first column
                        if (sn && sn !== 'Product SN' && sn.trim() !== '') {
                            if (!repairsByProduct[sn]) {
                                repairsByProduct[sn] = [];
                            }
                            
                            const repair = {};
                            headers.forEach((header, colIndex) => {
                                if (header && header.trim() !== '') {
                                    const propName = mapHeaderToProperty(header);
                                    const value = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                                    
                                    if (propName === 'repairCost') {
                                        repair[propName] = parseFloat(value) || 0;
                                    } else {
                                        repair[propName] = value;
                                    }
                                }
                            });
                            
                            repairsByProduct[sn].push(repair);
                        }
                    });
                
                console.log(`✅ Processed repairs for ${Object.keys(repairsByProduct).length} products`);
                
                setRepairsData(repairsByProduct);
                localStorage.setItem('repairsData', JSON.stringify(repairsByProduct));
            } else {
                console.log('ℹ️ No repairs data found');
                setRepairsData({});
            }
            
            // Process maintenance data
            if (maintenanceData.success && maintenanceData.data && maintenanceData.data.length > 0) {
                const maintenanceByProduct = {};
                const headers = maintenanceData.data[0] || [];
                const maintenanceRows = maintenanceData.data.slice(1);
                
                console.log('🔧 Maintenance headers:', headers);
                console.log('🔧 Total maintenance rows:', maintenanceRows.length);
                
                maintenanceRows
                    .filter(row => row && row.length > 0 && row.some(cell => cell && cell !== ''))
                    .forEach(row => {
                        const sn = row[0]; // Product SN is first column
                        if (sn && sn !== 'Product SN' && sn.trim() !== '') {
                            if (!maintenanceByProduct[sn]) {
                                maintenanceByProduct[sn] = [];
                            }
                            
                            const maintenance = {};
                            headers.forEach((header, colIndex) => {
                                if (header && header.trim() !== '') {
                                    const propName = mapHeaderToProperty(header);
                                    const value = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                                    maintenance[propName] = value;
                                }
                            });
                            
                            maintenanceByProduct[sn].push(maintenance);
                        }
                    });
                
                console.log(`✅ Processed maintenance for ${Object.keys(maintenanceByProduct).length} products`);
                
                setMaintenanceData(maintenanceByProduct);
                localStorage.setItem('maintenanceData', JSON.stringify(maintenanceByProduct));
            } else {
                console.log('ℹ️ No maintenance data found');
                setMaintenanceData({});
            }
            
            // Process specs data
            if (specsData.success && specsData.data && specsData.data.length > 0) {
                const specsByProduct = {};
                const headers = specsData.data[0] || [];
                const specsRows = specsData.data.slice(1);
                
                console.log('📐 Specs headers:', headers);
                console.log('📐 Total specs rows:', specsRows.length);
                
                specsRows
                    .filter(row => row && row.length > 0 && row.some(cell => cell && cell !== ''))
                    .forEach(row => {
                        const sn = row[0]; // Product SN is first column
                        if (sn && sn !== 'Product SN' && sn.trim() !== '') {
                            if (!specsByProduct[sn]) {
                                specsByProduct[sn] = [];
                            }
                            
                            const spec = {};
                            headers.forEach((header, colIndex) => {
                                if (header && header.trim() !== '') {
                                    const propName = mapHeaderToProperty(header);
                                    const value = row[colIndex] !== undefined && row[colIndex] !== null ? row[colIndex] : '';
                                    spec[propName] = value;
                                }
                            });
                            
                            specsByProduct[sn].push(spec);
                        }
                    });
                
                console.log(`✅ Processed specs for ${Object.keys(specsByProduct).length} products`);
                
                setSpecsData(specsByProduct);
                localStorage.setItem('specsData', JSON.stringify(specsByProduct));
            } else {
                console.log('ℹ️ No specs data found');
                setSpecsData({});
            }
            
            console.log('🎉 All data processed successfully');
            
        } catch (err) {
            console.error('❌ Error fetching all data:', err);
            setError(err.message);
            
            // Fallback to localStorage
            try {
                const storedProducts = localStorage.getItem('products');
                const storedRepairs = localStorage.getItem('repairsData');
                const storedMaintenance = localStorage.getItem('maintenanceData');
                const storedSpecs = localStorage.getItem('specsData');
                
                if (storedProducts) {
                    setProducts(JSON.parse(storedProducts));
                    console.log('📦 Loaded products from localStorage');
                }
                if (storedRepairs) {
                    setRepairsData(JSON.parse(storedRepairs));
                    console.log('📦 Loaded repairs from localStorage');
                }
                if (storedMaintenance) {
                    setMaintenanceData(JSON.parse(storedMaintenance));
                    console.log('📦 Loaded maintenance from localStorage');
                }
                if (storedSpecs) {
                    setSpecsData(JSON.parse(storedSpecs));
                    console.log('📦 Loaded specs from localStorage');
                }
            } catch (parseError) {
                console.error('❌ Error parsing stored data:', parseError);
            }
        } finally {
            setLoading(false);
        }
    };
    
    // Get repairs for a specific product
    const getRepairsBySn = (sn) => {
        return repairsData[sn] || [];
    };
    
    // Get maintenance for a specific product
    const getMaintenanceBySn = (sn) => {
        return maintenanceData[sn] || [];
    };
    
    // Get specs for a specific product
    const getSpecsBySn = (sn) => {
        return specsData[sn] || [];
    };
    
    // Calculate repair summary for a product
    const getRepairSummary = (sn) => {
        const repairs = getRepairsBySn(sn);
        if (repairs.length === 0) {
            return {
                repairCount: 0,
                totalRepairCost: 0,
                lastRepairDate: null,
                lastRepairCost: 0,
                partChanged: 'No'
            };
        }
        
        const sortedRepairs = [...repairs].sort((a, b) => {
            const dateA = new Date(a.repairDate || a.createdDate || '');
            const dateB = new Date(b.repairDate || b.createdDate || '');
            return dateB - dateA;
        });
        
        const lastRepair = sortedRepairs[0];
        const totalRepairCost = repairs.reduce((sum, repair) => sum + (repair.repairCost || 0), 0);
        
        return {
            repairCount: repairs.length,
            totalRepairCost: totalRepairCost,
            lastRepairDate: lastRepair.repairDate || lastRepair.createdDate || null,
            lastRepairCost: lastRepair.repairCost || 0,
            partChanged: lastRepair.partChanged || 'No'
        };
    };
    
    // Refresh all data
    const refreshAllData = async () => {
        return await fetchAllData();
    };
    
    // Alias for compatibility
    const refreshProducts = refreshAllData;
    
    // Initialize on mount
    useEffect(() => {
        fetchAllData();
    }, []);
    
    return (
        <ProductContext.Provider value={{
            products,
            loading,
            error,
            refreshAllData,
            refreshProducts,
            getRepairsBySn,
            getMaintenanceBySn,
            getSpecsBySn,
            getRepairSummary
        }}>
            {children}
        </ProductContext.Provider>
    )
};