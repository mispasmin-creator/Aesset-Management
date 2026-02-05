import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Loader, Save, Camera } from 'lucide-react';
import { useProduct } from '../context/ProductContext';

// Reusable InputField component
const InputField = ({ label, name, type = "text", value, onChange, placeholder, options, required = false, disabled = false }) => (
    <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
            <select
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent bg-white ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                required={required}
            >
                <option value="">Select {label}</option>
                {options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
        ) : type === 'textarea' ? (
            <textarea
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                rows="3"
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder={placeholder}
            />
        ) : (
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500 focus:border-transparent ${disabled ? 'bg-slate-50 text-slate-500' : ''}`}
                placeholder={placeholder}
                required={required}
            />
        )}
    </div>
);

// Section Header component
const SectionHeader = ({ title, subtitle = "" }) => (
    <div className="border-b border-light-blue-100 pb-2 mb-4 mt-2">
        <h3 className="text-lg font-bold text-light-blue-800">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
);

// Dynamic Spec Row component
const SpecRow = ({ spec, index, onChange, onRemove }) => (
    <div className="flex gap-4 items-end">
        <div className="flex-1">
            <InputField
                label="Spec Name"
                value={spec.name}
                onChange={(e) => onChange(index, 'name', e.target.value)}
                placeholder="e.g. RAM, Capacity, Weight"
            />
        </div>
        <div className="flex-1">
            <InputField
                label="Value"
                value={spec.value}
                onChange={(e) => onChange(index, 'value', e.target.value)}
                placeholder="e.g. 16GB, 500GB, 2.5kg"
            />
        </div>
        <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded mb-1"
        >
            <Trash2 size={20} />
        </button>
    </div>
);

// Part Name Row component
const PartNameRow = ({ part, index, onChange, onRemove }) => (
    <div className="flex gap-2 items-center">
        <input
            type="text"
            value={part}
            onChange={(e) => onChange(index, e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-light-blue-500"
            placeholder={`Part Name ${index + 1}`}
        />
        <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-2 text-red-500 hover:bg-red-50 rounded"
        >
            <Trash2 size={18} />
        </button>
    </div>
);

const AddProductModal = ({ isOpen, onClose, product = null }) => {
    const { addProduct, updateProduct, refreshProducts } = useProduct();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadedImages, setUploadedImages] = useState([]);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageFiles, setImageFiles] = useState([]);

    // Initial form state
    const initialFormData = {
        // Section 1: Basic Information
        productName: '',
        category: 'IT',
        type: 'Asset',
        brand: '',
        model: '',
        serialNo: '',
        sku: '',
        mfgDate: '',
        origin: 'India',
        status: 'Active',

        // Section 2: Asset Information
        assetDate: '',
        invoiceNo: '',
        assetValue: '',
        quantity: '1',
        supplierName: '',
        supplierPhone: '',
        supplierEmail: '',
        paymentMode: 'Online',

        // Section 3: Location & Ownership
        location: 'Warehouse',
        department: 'IT',
        assignedTo: '',
        usageType: 'Internal',
        storageLoc: '',
        responsiblePerson: '',

        // Section 4: Warranty & Service
        warrantyAvailable: 'No',
        warrantyProvider: '',
        warrantyStart: '',
        warrantyEnd: '',
        amc: 'No',
        amcProvider: '',
        amcStart: '',
        amcEnd: '',
        serviceContact: '',

        // Section 5: Maintenance (Goes to Product_Maintenance sheet)
        maintenanceRequired: 'No',
        maintenanceType: 'Preventive',
        frequency: 'Monthly',
        nextService: '',
        priority: 'Medium',
        technician: '',
        maintenanceNotes: '',

        // Section 7: Technical Specifications (Goes to Product_Specs sheet)
        specs: [],

        // Section 8: Financial & Depreciation
        depMethod: 'Straight Line',
        depRate: '10',
        assetLife: '5',
        residualValue: '0',

        // Section 9: Notes & Remarks
        internalNotes: '',
        usageRemarks: '',
        condition: 'Good',

        // Section 10: Repair Details (Goes to Product_Repairs sheet)
        lastRepairDate: '',
        repairCost: '0',
        partChanged: 'No',
        partNames: [],
        repairRemarks: '',
        repairTechnician: '',
    };

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (isOpen) {
            setSubmitError(null);
            setSubmitSuccess(false);
            setUploadedImages([]);
            setImageFiles([]);

            if (product) {
                // Edit Mode: Populate form with existing product data
                const populatedData = {
                    ...initialFormData,
                    ...product,
                    // Ensure arrays are properly initialized
                    specs: Array.isArray(product.specs) ? product.specs :
                        (product.specs ? JSON.parse(product.specs) : []),
                    partNames: Array.isArray(product.partNames) ? product.partNames :
                        (product.partNames ? JSON.parse(product.partNames) : []),
                    // Ensure date fields are formatted for input[type="date"]
                    // ✅ FIXED FIELD MAPPING (matches your sheet headers)

                    mfgDate: formatDateForInput(product["Mfg Date"] || product.mfgDate),

                    assetDate: formatDateForInput(product["Asset Date"] || product.assetDate),

                    supplierName:
                        product["Supplier"] ||
                        product.supplier ||
                        product.supplierName ||
                        "",

                    responsiblePerson:
                        product["Responsible"] ||
                        product.responsible ||
                        product.responsiblePerson ||
                        "",

                    warrantyStart: formatDateForInput(product["warrantyStart"] || product.warrantyStart),

                    warrantyEnd: formatDateForInput(product["warrantyEnd"] || product.warrantyEnd),

                    amcStart: formatDateForInput(product["amcStart"] || product.amcStart),

                    amcEnd: formatDateForInput(product["amcEnd"] || product.amcEnd),

                    nextService: formatDateForInput(product["nextService"] || product.nextService),

                    lastRepairDate: formatDateForInput(product["Last Repair"] || product.lastRepairDate),

                    repairCost: product["Last Cost"]?.toString() || product.repairCost || "0",

                    repairTechnician: product["technician"] || product.repairTechnician || "",

                    repairRemarks:
                        product["Repair Remarks"] ||
                        product["maintenanceNotes"] ||
                        product.repairRemarks ||
                        "",
                    // Ensure numeric fields are strings
                    assetValue: product.assetValue?.toString() || '',
                    quantity: product.quantity?.toString() || '1',
                    repairCost: product["Last Cost"]?.toString() || product.repairCost || "0",
                    depRate: product.depRate?.toString() || '10',
                    assetLife: product.assetLife?.toString() || '5',
                    residualValue: product.residualValue?.toString() || '0',
                };

                setFormData(populatedData);

                // Load existing images if any
                if (product.image_url) {
                    setUploadedImages([{
                        name: 'Product Image',
                        url: product.image_url,
                        size: 'N/A',
                        driveId: extractDriveId(product.image_url)
                    }]);
                }
            } else {
                // Add Mode: Reset to initial state
                setFormData(initialFormData);
                // Auto-generate serial number for new product
                generateSerialNumber();
            }
        }
    }, [isOpen, product]);

    // Helper function to format date for input[type="date"]
    const formatDateForInput = (dateString) => {
        if (!dateString) return "";

        try {
            // If already yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }

            // Handle dd/mm/yyyy OR dd/mm/yy
            if (dateString.includes("/")) {
                const parts = dateString.split("/");
                if (parts.length === 3) {
                    let [day, month, year] = parts;

                    // convert yy → yyyy
                    if (year.length === 2) {
                        year = "20" + year;
                    }

                    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                }
            }

            // Fallback
            const d = new Date(dateString);
            if (!isNaN(d)) {
                return d.toISOString().split("T")[0];
            }

            return "";
        } catch (err) {
            console.error("Date parse error:", err);
            return "";
        }
    };

    // Extract Drive ID from URL
    const extractDriveId = (url) => {
        try {
            const match = url.match(/id=([^&]+)/);
            return match ? match[1] : null;
        } catch {
            return null;
        }
    };

    // Format date to dd/mm/yyyy
    const formatDateToDMY = (dateString) => {
        if (!dateString) return "";

        try {
            // dateString will be yyyy-mm-dd
            const [year, month, day] = dateString.split("-");

            // yy from yyyy
            const shortYear = year.slice(-2);

            return `${day}/${month}/${shortYear}`;
        } catch (err) {
            console.error("formatDateToDMY error:", err);
            return "";
        }
    };


    // Auto-generate serial number
    const generateSerialNumber = async () => {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec?action=getNextSN');
            const data = await response.json();

            if (data.success && data.nextSN) {
                // Format as SN-0001, SN-0002, etc.
                const snNumber = data.nextSN.toString().padStart(4, '0');
                setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
            } else {
                // Fallback: get from local storage or generate
                const lastSN = localStorage.getItem('lastSN') || '0';
                const nextSN = parseInt(lastSN) + 1;
                const snNumber = nextSN.toString().padStart(4, '0');
                localStorage.setItem('lastSN', nextSN.toString());
                setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
            }
        } catch (error) {
            console.error('Error generating serial number:', error);
            // Client-side fallback
            const lastSN = localStorage.getItem('lastSN') || '0';
            const nextSN = parseInt(lastSN) + 1;
            const snNumber = nextSN.toString().padStart(4, '0');
            localStorage.setItem('lastSN', nextSN.toString());
            setFormData(prev => ({ ...prev, serialNo: `SN-${snNumber}` }));
        }
    };

    // Handle form field changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle spec changes
    const handleSpecChange = (index, field, value) => {
        const newSpecs = [...formData.specs];
        if (!newSpecs[index]) newSpecs[index] = { name: '', value: '' };
        newSpecs[index][field] = value;
        setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    // Add new spec
    const addSpec = () => {
        setFormData(prev => ({
            ...prev,
            specs: [...prev.specs, { name: '', value: '' }]
        }));
    };

    // Remove spec
    const removeSpec = (index) => {
        const newSpecs = formData.specs.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, specs: newSpecs }));
    };

    // Handle part name changes
    const handlePartNameChange = (index, value) => {
        const newParts = [...formData.partNames];
        newParts[index] = value;
        setFormData(prev => ({ ...prev, partNames: newParts }));
    };

    // Add new part name
    const addPartName = () => {
        if (formData.partNames.length < 5) {
            setFormData(prev => ({
                ...prev,
                partNames: [...prev.partNames, '']
            }));
        }
    };

    // Remove part name
    const removePartName = (index) => {
        const newParts = formData.partNames.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, partNames: newParts }));
    };

    // ✅ FIXED: Improved image upload with better error handling
 const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  setImageUploading(true);
  setSubmitError(null);

  try {
    for (const file of files) {
      // Size check (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`${file.name} exceeds 10MB limit`);
      }

      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // Extract only the base64 part (remove data:image/...;base64, prefix)
          const result = reader.result.split(',')[1];
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log("Base64 length:", base64.length);
      console.log("File name:", file.name);
      console.log("MIME type:", file.type);

      // Create URLSearchParams for proper form encoding
      const formData = new URLSearchParams();
      formData.append('action', 'uploadFile');
      formData.append('fileName', file.name);
      formData.append('mimeType', file.type);
      formData.append('base64Data', base64);
      formData.append('folderId', '1nJIhEL_6BTLuZ3mu3XLPJOES-95ZlFwf');

      console.log("Uploading to Google Apps Script...");

      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString()
        }
      );

      console.log("Response status:", response.status);
      
      const result = await response.json();
      console.log("Upload result:", result);

      if (!result.success) {
        throw new Error(result.error || "Upload failed");
      }

      // Add to uploaded images array
      setUploadedImages(prev => [
        ...prev,
        {
          name: file.name,
          url: result.fileUrl,
          size: (file.size / 1024 / 1024).toFixed(2) + " MB",
          driveId: result.fileId
        }
      ]);

      console.log("✓ Image uploaded successfully:", result.fileUrl);
    }

  } catch (err) {
    console.error("Upload error:", err);
    setSubmitError(`Upload failed: ${err.message}`);
  } finally {
    setImageUploading(false);
    e.target.value = ""; // Reset file input
  }
};

    // Remove uploaded image
    const removeImage = (index) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Helper function to submit data to specific sheet
    const submitToSheet = async (sheetName, rowData) => {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'insert',
                    sheetName: sheetName,
                    rowData: JSON.stringify(rowData)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(`Failed to save to ${sheetName}: ${result.error}`);
            }

            return result;
        } catch (error) {
            console.error(`Error submitting to ${sheetName}:`, error);
            throw error;
        }
    };

    // Update data in specific sheet
    const updateInSheet = async (sheetName, rowIndex, rowData) => {
        try {
            const response = await fetch('https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'update',
                    sheetName: sheetName,
                    rowIndex: rowIndex.toString(),
                    rowData: JSON.stringify(rowData)
                })
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(`Failed to update in ${sheetName}: ${result.error}`);
            }

            return result;
        } catch (error) {
            console.error(`Error updating in ${sheetName}:`, error);
            throw error;
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);

        try {
            // Basic validation
            if (!formData.productName.trim()) {
                throw new Error('Product Name is required');
            }

            if (!formData.serialNo.trim()) {
                throw new Error('Serial Number is required');
            }

            // Get current timestamp
            const currentTimestamp = new Date().toISOString();

            if (product) {
                // EDIT MODE - Update existing product

                // 1. Update main product information in Products sheet
                const mainProductData = [
                    currentTimestamp, // Timestamp
                    formData.serialNo, // Serial No
                    formData.productName, // Product Name
                    formData.category, // Category
                    formData.type, // Type
                    formData.brand, // Brand
                    formData.model, // Model
                    formData.sku, // SKU
                    formatDateToDMY(formData.mfgDate), // Mfg Date
                    formData.origin, // Origin
                    formData.status, // Status
                    formatDateToDMY(formData.assetDate), // Asset Date
                    formData.invoiceNo, // Invoice No
                    parseFloat(formData.assetValue) || 0, // Cost
                    parseInt(formData.quantity) || 1, // Qty
                    formData.supplierName, // Supplier
                    formData.paymentMode, // Payment
                    formData.location, // Location
                    formData.department, // Department
                    formData.assignedTo, // Assigned To
                    formData.responsiblePerson, // Responsible
                    formData.warrantyAvailable, // Warranty
                    formData.amc, // AMC
                    formData.maintenanceRequired, // Maintenance
                    formData.priority, // Priority
                    formatDateToDMY(formData.lastRepairDate), // Last Repair
                    parseFloat(formData.repairCost) || 0, // Last Cost
                    formData.partChanged, // Part Chg?
                    formData.partNames[0] || '', // Part 1
                    formData.partNames[1] || '', // Part 2
                    formData.partNames[2] || '', // Part 3
                    formData.partNames[3] || '', // Part 4
                    formData.partNames[4] || '', // Part 5
                    '0', // Count (removed as requested)
                    '0', // Total Cost (removed as requested)
                    parseFloat(formData.assetValue) || 0, // Asset Value
                    formData.depMethod, // Dep. Method
                    'admin', // Created By
                    product.id || '', // id
                    formData.supplierPhone, // supplierPhone
                    formData.supplierEmail, // supplierEmail
                    formData.usageType, // usageType
                    formData.storageLoc, // storageLoc
                    formData.warrantyProvider, // warrantyProvider
                    formatDateToDMY(formData.warrantyStart), // warrantyStart
                    formatDateToDMY(formData.warrantyEnd), // warrantyEnd
                    formData.amcProvider, // amcProvider
                    formatDateToDMY(formData.amcStart), // amcStart
                    formatDateToDMY(formData.amcEnd), // amcEnd
                    formData.serviceContact, // serviceContact
                    formData.maintenanceType, // maintenanceType
                    formData.frequency, // frequency
                    formatDateToDMY(formData.nextService), // nextService
                    formData.technician, // technician
                    formData.maintenanceNotes, // maintenanceNotes
                    parseFloat(formData.depRate) || 10, // depRate
                    parseInt(formData.assetLife) || 5, // assetLife
                    parseFloat(formData.residualValue) || 0, // residualValue
                    formData.internalNotes, // internalNotes
                    formData.usageRemarks, // usageRemarks
                    formData.condition, // condition
                    'admin', // updatedBy
                    currentTimestamp, // updatedDate
                    product.qr_code_url || '', // qr_code_url
                    uploadedImages.length > 0 ? uploadedImages[0].url : (product.image_url || ''), // image_url
                    formData.category, // tags
                    '1' // edition
                ];

                // Update main product in Products sheet
                await updateInSheet('Products', product.rowIndex || 2, mainProductData);

                // 2. If there are repair details, add to Product_Repairs sheet
                if (formData.lastRepairDate && formData.repairCost && formData.repairCost !== '0') {
                    const repairData = [
                        formData.serialNo, // Product SN
                        formatDateToDMY(formData.lastRepairDate), // Repair Date
                        parseFloat(formData.repairCost) || 0, // Repair Cost
                        formData.partChanged, // Part Changed
                        formData.partNames[0] || '', // Part 1
                        formData.partNames[1] || '', // Part 2
                        formData.partNames[2] || '', // Part 3
                        formData.partNames[3] || '', // Part 4
                        formData.partNames[4] || '', // Part 5
                        formData.repairTechnician || '', // Technician
                        formData.repairRemarks || '', // Remarks
                        currentTimestamp // Created Date
                    ];

                    // Submit to Product_Repairs sheet
                    await submitToSheet('Product_Repairs', repairData);
                }

                // 3. If there are maintenance details, add to Product_Maintenance sheet
                if (formData.maintenanceRequired === 'Yes') {
                    const maintenanceData = [
                        formData.serialNo, // Product SN
                        formData.maintenanceRequired, // Maintenance Required
                        formData.maintenanceType, // Maintenance Type
                        formData.frequency, // Frequency
                        formatDateToDMY(formData.nextService), // Next Service Date
                        formData.priority, // Priority
                        formData.technician, // Technician
                        formData.maintenanceNotes, // Notes
                        currentTimestamp // Created Date
                    ];

                    // Submit to Product_Maintenance sheet
                    await submitToSheet('Product_Maintenance', maintenanceData);
                }

                // 4. If there are specs, add to Product_Specs sheet
                if (formData.specs.length > 0) {
                    // First, delete existing specs for this product
                    // Note: You might want to implement a delete function for specs
                    // For now, we'll just add new ones

                    for (const spec of formData.specs) {
                        if (spec.name && spec.value) {
                            const specData = [
                                formData.serialNo, // Product SN
                                spec.name, // Spec Name
                                spec.value, // Spec Value
                                currentTimestamp // Created Date
                            ];

                            // Submit to Product_Specs sheet
                            await submitToSheet('Product_Specs', specData);
                        }
                    }
                }

                setSubmitSuccess(true);
                setTimeout(() => {
                    onClose();
                    refreshProducts();
                }, 1500);

            } else {
                // ADD MODE - Create new product

                // 1. Prepare main product data for Products sheet
                const mainProductData = [
                    currentTimestamp, // Timestamp
                    formData.serialNo, // Serial No
                    formData.productName, // Product Name
                    formData.category, // Category
                    formData.type, // Type
                    formData.brand, // Brand
                    formData.model, // Model
                    formData.sku, // SKU
                    formatDateToDMY(formData.mfgDate), // Mfg Date
                    formData.origin, // Origin
                    formData.status, // Status
                    formatDateToDMY(formData.assetDate), // Asset Date
                    formData.invoiceNo, // Invoice No
                    parseFloat(formData.assetValue) || 0, // Cost
                    parseInt(formData.quantity) || 1, // Qty
                    formData.supplierName, // Supplier
                    formData.paymentMode, // Payment
                    formData.location, // Location
                    formData.department, // Department
                    formData.assignedTo, // Assigned To
                    formData.responsiblePerson, // Responsible
                    formData.warrantyAvailable, // Warranty
                    formData.amc, // AMC
                    formData.maintenanceRequired, // Maintenance
                    formData.priority, // Priority
                    formatDateToDMY(formData.lastRepairDate), // Last Repair
                    parseFloat(formData.repairCost) || 0, // Last Cost
                    formData.partChanged, // Part Chg?
                    formData.partNames[0] || '', // Part 1
                    formData.partNames[1] || '', // Part 2
                    formData.partNames[2] || '', // Part 3
                    formData.partNames[3] || '', // Part 4
                    formData.partNames[4] || '', // Part 5
                    '0', // Count (removed as requested)
                    '0', // Total Cost (removed as requested)
                    parseFloat(formData.assetValue) || 0, // Asset Value
                    formData.depMethod, // Dep. Method
                    'admin', // Created By
                    '', // id (will be auto-generated)
                    formData.supplierPhone, // supplierPhone
                    formData.supplierEmail, // supplierEmail
                    formData.usageType, // usageType
                    formData.storageLoc, // storageLoc
                    formData.warrantyProvider, // warrantyProvider
                    formatDateToDMY(formData.warrantyStart), // warrantyStart
                    formatDateToDMY(formData.warrantyEnd), // warrantyEnd
                    formData.amcProvider, // amcProvider
                    formatDateToDMY(formData.amcStart), // amcStart
                    formatDateToDMY(formData.amcEnd), // amcEnd
                    formData.serviceContact, // serviceContact
                    formData.maintenanceType, // maintenanceType
                    formData.frequency, // frequency
                    formatDateToDMY(formData.nextService), // nextService
                    formData.technician, // technician
                    formData.maintenanceNotes, // maintenanceNotes
                    parseFloat(formData.depRate) || 10, // depRate
                    parseInt(formData.assetLife) || 5, // assetLife
                    parseFloat(formData.residualValue) || 0, // residualValue
                    formData.internalNotes, // internalNotes
                    formData.usageRemarks, // usageRemarks
                    formData.condition, // condition
                    '', // updatedBy
                    '', // updatedDate
                    '', // qr_code_url
                    uploadedImages.length > 0 ? uploadedImages[0].url : '', // image_url
                    formData.category, // tags
                    '1' // edition
                ];

                // 2. Submit main product to Products sheet
                await submitToSheet('Products', mainProductData);

                // 3. If there are repair details, add to Product_Repairs sheet
                if (formData.lastRepairDate && formData.repairCost && formData.repairCost !== '0') {
                    const repairData = [
                        formData.serialNo, // Product SN
                        formatDateToDMY(formData.lastRepairDate), // Repair Date
                        parseFloat(formData.repairCost) || 0, // Repair Cost
                        formData.partChanged, // Part Changed
                        formData.partNames[0] || '', // Part 1
                        formData.partNames[1] || '', // Part 2
                        formData.partNames[2] || '', // Part 3
                        formData.partNames[3] || '', // Part 4
                        formData.partNames[4] || '', // Part 5
                        formData.repairTechnician || '', // Technician
                        formData.repairRemarks || '', // Remarks
                        currentTimestamp // Created Date
                    ];

                    // Submit to Product_Repairs sheet
                    await submitToSheet('Product_Repairs', repairData);
                }

                // 4. If there are maintenance details, add to Product_Maintenance sheet
                if (formData.maintenanceRequired === 'Yes') {
                    const maintenanceData = [
                        formData.serialNo, // Product SN
                        formData.maintenanceRequired, // Maintenance Required
                        formData.maintenanceType, // Maintenance Type
                        formData.frequency, // Frequency
                        formatDateToDMY(formData.nextService), // Next Service Date
                        formData.priority, // Priority
                        formData.technician, // Technician
                        formData.maintenanceNotes, // Notes
                        currentTimestamp // Created Date
                    ];

                    // Submit to Product_Maintenance sheet
                    await submitToSheet('Product_Maintenance', maintenanceData);
                }

                // 5. If there are specs, add to Product_Specs sheet
                if (formData.specs.length > 0) {
                    for (const spec of formData.specs) {
                        if (spec.name && spec.value) {
                            const specData = [
                                formData.serialNo, // Product SN
                                spec.name, // Spec Name
                                spec.value, // Spec Value
                                currentTimestamp // Created Date
                            ];

                            // Submit to Product_Specs sheet
                            await submitToSheet('Product_Specs', specData);
                        }
                    }
                }

                setSubmitSuccess(true);
                setTimeout(() => {
                    onClose();
                    refreshProducts();
                }, 1500);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setSubmitError(error.message || 'Failed to save product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-light-blue-600 to-light-blue-700 rounded-t-xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {product ? 'Edit Product' : 'Add New Product'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            {product ? `Editing: ${product.productName}` : 'Fill in all required fields (*)'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-2 hover:bg-white/20 rounded-full transition-colors text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Status Messages */}
                {submitError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-6 mt-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <X className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{submitError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {submitSuccess && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mx-6 mt-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Save className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">
                                    {product ? 'Product updated successfully!' : 'Product added successfully!'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
                        {/* SECTION 1: Basic Product Information */}
                        <section>
                            <SectionHeader
                                title="SECTION 1: Basic Product Information"
                                subtitle="Core details about the product"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Product Name *"
                                    name="productName"
                                    value={formData.productName}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter product name"
                                />
                                <InputField
                                    label="Category"
                                    name="category"
                                    type="select"
                                    options={['Electronics', 'IT', 'Machinery', 'Furniture', 'Tools', 'Office Equipment']}
                                    value={formData.category}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Type"
                                    name="type"
                                    type="select"
                                    options={['Asset', 'Consumable', 'Non-Consumable']}
                                    value={formData.type}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Brand/Manufacturer"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    placeholder="Enter brand name"
                                />
                                <InputField
                                    label="Model Number"
                                    name="model"
                                    value={formData.model}
                                    onChange={handleChange}
                                    placeholder="Enter model number"
                                />
                                <InputField
                                    label="Serial Number *"
                                    name="serialNo"
                                    value={formData.serialNo}
                                    onChange={handleChange}
                                    required
                                    disabled={!!product}
                                    placeholder="Auto-generated (e.g., SN-0001)"
                                />
                                <InputField
                                    label="SKU / Product Code"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="Enter SKU code"
                                />
                                <InputField
                                    label="Manufacturing Date"
                                    name="mfgDate"
                                    type="date"
                                    value={formData.mfgDate}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Country of Origin"
                                    name="origin"
                                    type="select"
                                    options={['India', 'China', 'USA', 'Germany', 'Japan', 'South Korea', 'Taiwan']}
                                    value={formData.origin}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Status"
                                    name="status"
                                    type="select"
                                    options={['Active', 'Inactive', 'Under Maintenance', 'Disposed']}
                                    value={formData.status}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 2: Asset Information */}
                        <section>
                            <SectionHeader
                                title="SECTION 2: Asset Information"
                                subtitle="Purchase and financial details"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Asset Date"
                                    name="assetDate"
                                    type="date"
                                    value={formData.assetDate}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Invoice Number"
                                    name="invoiceNo"
                                    value={formData.invoiceNo}
                                    onChange={handleChange}
                                    placeholder="Enter invoice number"
                                />
                                <InputField
                                    label="Asset Value (₹)"
                                    name="assetValue"
                                    type="number"
                                    value={formData.assetValue}
                                    onChange={handleChange}
                                    placeholder="Enter cost"
                                />
                                <InputField
                                    label="Quantity"
                                    name="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    placeholder="Enter quantity"
                                />
                                <InputField
                                    label="Supplier Name"
                                    name="supplierName"
                                    value={formData.supplierName}
                                    onChange={handleChange}
                                    placeholder="Enter supplier name"
                                />
                                <InputField
                                    label="Supplier Phone"
                                    name="supplierPhone"
                                    value={formData.supplierPhone}
                                    onChange={handleChange}
                                    placeholder="Enter supplier phone"
                                />
                                <InputField
                                    label="Supplier Email"
                                    name="supplierEmail"
                                    type="email"
                                    value={formData.supplierEmail}
                                    onChange={handleChange}
                                    placeholder="Enter supplier email"
                                />
                                <InputField
                                    label="Payment Mode"
                                    name="paymentMode"
                                    type="select"
                                    options={['Online', 'Cash', 'Credit', 'Cheque', 'Bank Transfer']}
                                    value={formData.paymentMode}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 3: Location & Ownership */}
                        <section>
                            <SectionHeader
                                title="SECTION 3: Location & Ownership"
                                subtitle="Where and who uses this product"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Assigned Location"
                                    name="location"
                                    type="select"
                                    options={['Warehouse', 'Office', 'Plant Floor 1', 'IT Server Room', 'Admin Building', 'Lab']}
                                    value={formData.location}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Department"
                                    name="department"
                                    type="select"
                                    options={['IT', 'Production', 'Admin', 'Finance', 'HR', 'Marketing', 'R&D']}
                                    value={formData.department}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Assigned To"
                                    name="assignedTo"
                                    value={formData.assignedTo}
                                    onChange={handleChange}
                                    placeholder="Employee or team name"
                                />
                                <InputField
                                    label="Usage Type"
                                    name="usageType"
                                    type="select"
                                    options={['Internal', 'External', 'Rental', 'Leased']}
                                    value={formData.usageType}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Storage Location"
                                    name="storageLoc"
                                    value={formData.storageLoc}
                                    onChange={handleChange}
                                    placeholder="Rack / Room / Shelf details"
                                />
                                <InputField
                                    label="Responsible Person"
                                    name="responsiblePerson"
                                    value={formData.responsiblePerson}
                                    onChange={handleChange}
                                    placeholder="Person in charge"
                                />
                            </div>
                        </section>

                        {/* SECTION 4: Warranty & Service Details */}
                        <section>
                            <SectionHeader
                                title="SECTION 4: Warranty & Service Details"
                                subtitle="Warranty and maintenance contract information"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Warranty Available"
                                    name="warrantyAvailable"
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.warrantyAvailable}
                                    onChange={handleChange}
                                />

                                {formData.warrantyAvailable === 'Yes' && (
                                    <>
                                        <InputField
                                            label="Warranty Provider"
                                            name="warrantyProvider"
                                            value={formData.warrantyProvider}
                                            onChange={handleChange}
                                            placeholder="Warranty provider name"
                                        />
                                        <InputField
                                            label="Warranty Start Date"
                                            name="warrantyStart"
                                            type="date"
                                            value={formData.warrantyStart}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Warranty End Date"
                                            name="warrantyEnd"
                                            type="date"
                                            value={formData.warrantyEnd}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}

                                <InputField
                                    label="AMC Contract"
                                    name="amc"
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.amc}
                                    onChange={handleChange}
                                />

                                {formData.amc === 'Yes' && (
                                    <>
                                        <InputField
                                            label="AMC Provider"
                                            name="amcProvider"
                                            value={formData.amcProvider}
                                            onChange={handleChange}
                                            placeholder="AMC provider name"
                                        />
                                        <InputField
                                            label="AMC Start Date"
                                            name="amcStart"
                                            type="date"
                                            value={formData.amcStart}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="AMC End Date"
                                            name="amcEnd"
                                            type="date"
                                            value={formData.amcEnd}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}

                                <InputField
                                    label="Service Contact"
                                    name="serviceContact"
                                    value={formData.serviceContact}
                                    onChange={handleChange}
                                    placeholder="Service helpline or contact"
                                />
                            </div>
                        </section>

                        {/* SECTION 5: Maintenance Configuration */}
                        <section>
                            <SectionHeader
                                title="SECTION 5: Maintenance Configuration"
                                subtitle="Maintenance schedule and requirements - Will be saved in Product_Maintenance sheet"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Maintenance Required"
                                    name="maintenanceRequired"
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.maintenanceRequired}
                                    onChange={handleChange}
                                />

                                {formData.maintenanceRequired === 'Yes' && (
                                    <>
                                        <InputField
                                            label="Maintenance Type"
                                            name="maintenanceType"
                                            type="select"
                                            options={['Preventive', 'Breakdown', 'Predictive', 'Corrective']}
                                            value={formData.maintenanceType}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Frequency"
                                            name="frequency"
                                            type="select"
                                            options={['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']}
                                            value={formData.frequency}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Next Service Date"
                                            name="nextService"
                                            type="date"
                                            value={formData.nextService}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Priority"
                                            name="priority"
                                            type="select"
                                            options={['Low', 'Medium', 'High', 'Critical']}
                                            value={formData.priority}
                                            onChange={handleChange}
                                        />
                                        <InputField
                                            label="Technician"
                                            name="technician"
                                            value={formData.technician}
                                            onChange={handleChange}
                                            placeholder="Assigned technician"
                                        />
                                        <div className="md:col-span-2">
                                            <InputField
                                                label="Maintenance Notes"
                                                name="maintenanceNotes"
                                                type="textarea"
                                                value={formData.maintenanceNotes}
                                                onChange={handleChange}
                                                placeholder="Special instructions or notes"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>

                        {/* SECTION 6: Image Upload */}
                        <section>
                            <SectionHeader
                                title="SECTION 6: Product Images"
                                subtitle="Upload product images (Optional)"
                            />
                            <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                                <Camera className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600 mb-3">
                                    Upload Product Images to Google Drive (Max 5 images, 10MB each)
                                </p>

                                <div className="mb-3">
                                    <input
                                        type="file"
                                        id="image-upload"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        disabled={imageUploading}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer ${imageUploading ? 'bg-slate-300' : 'bg-white border border-slate-300 hover:bg-slate-50'} transition-colors`}
                                    >
                                        {imageUploading ? (
                                            <>
                                                <Loader className="animate-spin h-4 w-4" />
                                                Uploading to Google Drive...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4" />
                                                Select Images
                                            </>
                                        )}
                                    </label>
                                    <p className="text-xs text-slate-500 mt-2">
                                        Images will be uploaded to Google Drive folder: Product Images
                                    </p>
                                </div>

                                {/* Uploaded Images Preview */}
                                {uploadedImages.length > 0 && (
                                    <div className="mt-4">
                                        <p className="text-sm font-medium text-slate-700 mb-2">Uploaded Images:</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {uploadedImages.map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image.url}
                                                        alt={image.name}
                                                        className="w-full h-24 object-cover rounded-lg border border-slate-200"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                    <p className="text-xs text-slate-500 truncate mt-1">{image.name}</p>
                                                    <p className="text-xs text-slate-400">{image.size}</p>
                                                    <a
                                                        href={image.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-light-blue-600 hover:underline"
                                                    >
                                                        Google Drive Link
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* SECTION 7: Technical Specifications */}
                        <section>
                            <SectionHeader
                                title="SECTION 7: Technical Specifications"
                                subtitle="Add technical details and specifications - Will be saved in Product_Specs sheet"
                            />
                            <div className="space-y-3">
                                {formData.specs.map((spec, index) => (
                                    <SpecRow
                                        key={index}
                                        spec={spec}
                                        index={index}
                                        onChange={handleSpecChange}
                                        onRemove={removeSpec}
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={addSpec}
                                    className="flex items-center gap-2 text-sm text-light-blue-600 font-medium hover:text-light-blue-700"
                                >
                                    <Plus size={16} /> Add Specification
                                </button>
                            </div>
                        </section>

                        {/* SECTION 8: Financial & Depreciation */}
                        <section>
                            <SectionHeader
                                title="SECTION 8: Financial & Depreciation"
                                subtitle="Asset valuation and depreciation details"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Depreciation Method"
                                    name="depMethod"
                                    type="select"
                                    options={['Straight Line', 'WDV', 'None']}
                                    value={formData.depMethod}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Depreciation Rate (%)"
                                    name="depRate"
                                    type="number"
                                    value={formData.depRate}
                                    onChange={handleChange}
                                    placeholder="Enter rate"
                                />
                                <InputField
                                    label="Asset Life (Years)"
                                    name="assetLife"
                                    type="number"
                                    value={formData.assetLife}
                                    onChange={handleChange}
                                    placeholder="Enter lifespan"
                                />
                                <InputField
                                    label="Residual Value (₹)"
                                    name="residualValue"
                                    type="number"
                                    value={formData.residualValue}
                                    onChange={handleChange}
                                    placeholder="Scrap value"
                                />
                            </div>
                        </section>

                        {/* SECTION 9: Notes & Remarks */}
                        <section>
                            <SectionHeader
                                title="SECTION 9: Notes & Remarks"
                                subtitle="Additional information and observations"
                            />
                            <div className="grid grid-cols-1 gap-4">
                                <InputField
                                    label="Internal Notes"
                                    name="internalNotes"
                                    type="textarea"
                                    value={formData.internalNotes}
                                    onChange={handleChange}
                                    placeholder="Internal comments or observations"
                                />
                                <InputField
                                    label="Usage Remarks"
                                    name="usageRemarks"
                                    type="textarea"
                                    value={formData.usageRemarks}
                                    onChange={handleChange}
                                    placeholder="How this product is used"
                                />
                                <InputField
                                    label="Condition Notes"
                                    name="condition"
                                    type="select"
                                    options={['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair']}
                                    value={formData.condition}
                                    onChange={handleChange}
                                />
                            </div>
                        </section>

                        {/* SECTION 10: Repair Details */}
                        <section>
                            <SectionHeader
                                title="SECTION 10: Repair History"
                                subtitle="Past repair and maintenance records - Will be saved in Product_Repairs sheet"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <InputField
                                    label="Last Repair Date"
                                    name="lastRepairDate"
                                    type="date"
                                    value={formData.lastRepairDate}
                                    onChange={handleChange}
                                />
                                <InputField
                                    label="Last Repair Cost (₹)"
                                    name="repairCost"
                                    type="number"
                                    value={formData.repairCost}
                                    onChange={handleChange}
                                    placeholder="Enter cost"
                                />
                                <InputField
                                    label="Repair Technician"
                                    name="repairTechnician"
                                    value={formData.repairTechnician}
                                    onChange={handleChange}
                                    placeholder="Technician name"
                                />
                                <InputField
                                    label="Repair Remarks"
                                    name="repairRemarks"
                                    type="textarea"
                                    value={formData.repairRemarks}
                                    onChange={handleChange}
                                    placeholder="Repair details or notes"
                                />
                                {/* Removed Repair Count and Total Repair Cost as requested */}
                                <InputField
                                    label="Part Changed?"
                                    name="partChanged"
                                    type="select"
                                    options={['Yes', 'No']}
                                    value={formData.partChanged}
                                    onChange={handleChange}
                                />
                            </div>

                            {formData.partChanged === 'Yes' && (
                                <div className="mt-6 p-4 border border-slate-200 rounded-lg bg-slate-50">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-medium text-slate-700">Parts Changed</h4>
                                        <span className="text-xs text-slate-500">Max 5 parts</span>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.partNames.map((part, index) => (
                                            <PartNameRow
                                                key={index}
                                                part={part}
                                                index={index}
                                                onChange={handlePartNameChange}
                                                onRemove={removePartName}
                                            />
                                        ))}
                                        {formData.partNames.length < 5 && (
                                            <button
                                                type="button"
                                                onClick={addPartName}
                                                className="flex items-center gap-2 text-sm text-light-blue-600 font-medium hover:text-light-blue-700"
                                            >
                                                <Plus size={16} /> Add Part Name
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white rounded-b-xl flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        <span className="text-red-500">*</span> Required fields
                        <div className="mt-1 text-xs text-slate-400">
                            Serial No: <span className="font-medium">{formData.serialNo}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="product-form"
                            disabled={isSubmitting || imageUploading}
                            className="px-6 py-2 bg-gradient-to-r from-light-blue-600 to-cyan-600 hover:from-light-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    <span>{product ? 'Update Product' : 'Save Product'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddProductModal;