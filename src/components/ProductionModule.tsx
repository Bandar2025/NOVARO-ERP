import React, { useState, useEffect } from "react";
import { useAppState } from "../context/StateContext";
import { JobStatus, ItemCategory, Batch, Recipe } from "../types";
import { 
  Flame, Cpu, FileText, Play, CheckCircle2, RotateCw, 
  Settings, Layers, RefreshCw, AlertTriangle, Coffee, Hammer, X, Plus, Sparkles, Printer
} from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";

interface ProductionModuleProps {
  language?: "ar" | "en";
}

export default function ProductionModule({ language = "ar" }: ProductionModuleProps) {
  const isAr = language === "ar";
  const { 
    recipes, items, batches, roastingJobs, grindingJobs, packagingJobs,
    addRoastingJob, addGrindingJob, addPackagingJob, addToast
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<"recipes" | "roasting" | "grinding" | "packaging">("recipes");

  // State for recipe adding
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [recName, setRecName] = useState("");
  const [recNameAr, setRecNameAr] = useState("");
  const [recDescription, setRecDescription] = useState("");
  const [recOutputItemId, setRecOutputItemId] = useState("");
  const [recInputs, setRecInputs] = useState<{ itemId: string; quantity: number }[]>([
    { itemId: "", quantity: 0 }
  ]);

  // State for Roasting Job Simulator
  const [roastRecipeId, setRoastRecipeId] = useState("");
  const [roastInputItemId, setRoastInputItemId] = useState("");
  const [roastInputQty, setRoastInputQty] = useState<number>(100);
  const [roastOutputItemId, setRoastOutputItemId] = useState("");
  const [roastOutputQty, setRoastOutputQty] = useState<number>(85); // expected yield after moisture loss
  const [roastTime, setRoastTime] = useState<number>(15);
  const [roastTemp, setRoastTemp] = useState<number>(205);
  const [roastWorker, setRoastWorker] = useState(isAr ? "عبدالرحمن الحربي" : "Abdulrahman Al-Harbi");
  const [roastError, setRoastError] = useState<string | null>(null);

  // Roasting Simulation Progress
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastStep, setRoastStep] = useState(0);
  const [roastStepsLogs, setRoastStepsLogs] = useState<string[]>([]);
  const [simTemp, setSimTemp] = useState(25); // Starts at room temp

  // Grinding Job Form
  const [grindInputBatchNo, setGrindInputBatchNo] = useState("");
  const [grindInputItemId, setGrindInputItemId] = useState("");
  const [grindInputQty, setGrindInputQty] = useState<number>(50);
  const [grindOutputItemId, setGrindOutputItemId] = useState("");
  const [grindOutputQty, setGrindOutputQty] = useState<number>(49.5);
  const [grindError, setGrindError] = useState<string | null>(null);
  const [grindSuccess, setGrindSuccess] = useState<string | null>(null);

  // Packaging Job Form
  const [packInputBatchNo, setPackInputBatchNo] = useState("");
  const [packInputItemId, setPackInputItemId] = useState("");
  const [packInputQty, setPackInputQty] = useState<number>(25);
  const [packPouchItemId, setPackPouchItemId] = useState("");
  const [packFinishedItemId, setPackFinishedItemId] = useState("");
  const [packFinishedQty, setPackFinishedQty] = useState<number>(100); // e.g. 25kg powder packs into 100 bags of 250g
  const [packError, setPackError] = useState<string | null>(null);
  const [packSuccess, setPackSuccess] = useState<string | null>(null);

  // Filters for dropdown items
  const rawMaterials = items.filter(i => i.category === ItemCategory.GreenCoffee || i.category === ItemCategory.RawSpices);
  const roastedMaterials = items.filter(i => i.category === ItemCategory.RoastedCoffee || i.category === ItemCategory.ProcessedSpices);
  const groundMaterials = items.filter(i => i.category === ItemCategory.GroundCoffee);
  const pouchMaterials = items.filter(i => i.category === ItemCategory.PackagingMaterial);
  const finishedProducts = items.filter(i => i.category === ItemCategory.FinishedProduct);

  const handleRecipeChange = (recipeId: string) => {
    setRoastRecipeId(recipeId);
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      // Find output item and set fields
      if (recipeId === "rec-1") {
        setRoastInputItemId("item-2"); // Brazilian Green
        setRoastOutputItemId("item-6"); // Brazilian Roasted
      } else if (recipeId === "rec-2") {
        setRoastInputItemId("item-1"); // Ethiopian Green
        setRoastOutputItemId("item-5"); // Ethiopian Roasted
      } else {
        setRoastInputItemId(recipe.rawMaterials[0]?.itemId || "");
        setRoastOutputItemId(recipe.outputItemId);
      }
    }
  };

  // Trigger roasting cycle
  const startRoastingCycle = (e: React.FormEvent) => {
    e.preventDefault();
    setRoastError(null);

    // Validate stocks
    const greenBatches = batches.filter(b => b.itemId === roastInputItemId && b.quantity > 0);
    const totalGreenAvailable = greenBatches.reduce((acc, b) => acc + b.quantity, 0);

    if (totalGreenAvailable < roastInputQty) {
      setRoastError(
        isAr 
          ? `خطأ: كمية البن الخام الأخضر المتاحة غير كافية في مخازن FIFO. المتاح: ${totalGreenAvailable} كجم، المطلوب: ${roastInputQty} كجم.`
          : `Insufficient green beans available in FIFO warehouse lot. Available: ${totalGreenAvailable}kg, Requested: ${roastInputQty}kg.`
      );
      return;
    }

    if (roastOutputQty >= roastInputQty) {
      setRoastError(
        isAr 
          ? "خطأ: لا يمكن أن يساوي وزن البن المحمص الوزن الخام بسبب تبخر الرطوبة أثناء المعالجة (الفقد المعتاد 12% - 20%)."
          : "Invalid Roasting Yield: Roasted output cannot equal or exceed raw input weight due to moisture evaporation (12%-20% loss expected)."
      );
      return;
    }

    setIsRoasting(true);
    setRoastStep(0);
    setRoastStepsLogs([
      isAr 
        ? "[المحمص RST-01]: جاري معايرة صمامات الغاز وتشغيل المشعل التوربيني..."
        : "[BURNER RST-01]: Calibrating gas valves and igniting turbo burner..."
    ]);
    setSimTemp(25);
  };

  useEffect(() => {
    if (!isRoasting) return;

    let timer: NodeJS.Timeout;
    const stages = isAr ? [
      { step: 1, temp: 80, log: "[المحمص RST-01]: جاري تسخين أسطوانة التحميص مسبقاً للوصول لدرجة الشحن... (80°م)" },
      { step: 2, temp: 150, log: "[المحمص RST-01]: تم شحن وتفريغ البن الأخضر بالداخل. بدء مرحلة التجفيف وتبخر الرطوبة... (150°م)" },
      { step: 3, temp: 195, log: "[المحمص RST-01]: بدء تفاعل مايلارد الكيميائي. تبدل لون الحبوب إلى الأصفر الفاتح وتطاير القشور... (195°م)" },
      { step: 4, temp: 205, log: "[المحمص RST-01]: سـمـاع الـطـقـطـقـة الأولـى (First Crack)! انفجار خلايا البن الغازية وتضاعف الحجم... (205°م)" },
      { step: 5, temp: roastTemp, log: `[المحمص RST-01]: بلوغ مرحلة التطوير العطري المطلوبة. إغلاق صمامات الحرارة عند ${roastTemp}°م.` },
      { step: 6, temp: 55, log: "[المحمص RST-01]: تفريغ الشحنة في حوض التبريد الدوار. تشغيل مراوح شفط الهواء لمنع تفحم الزيوت... (55°م)" },
      { step: 7, temp: 25, log: "[المحمص RST-01]: اكتمل التحميص بنجاح وجاري إرسال كود الوجبة وجداول FIFO إلى المحاسبة والمستودعات." }
    ] : [
      { step: 1, temp: 80, log: "[KILN RST-01]: Preheating chamber to target charge temperature... (80°C)" },
      { step: 2, temp: 150, log: "[KILN RST-01]: Raw green beans charged. Drying phase started. Evaporating water moisture... (150°C)" },
      { step: 3, temp: 195, log: "[KILN RST-01]: Maillard reaction active. Yellowing color transformation. Separation of silver skin chaff... (195°C)" },
      { step: 4, temp: 205, log: "[KILN RST-01]: FIRST CRACK ENGAGED! Cellular moisture expanding and popping... (205°C)" },
      { step: 5, temp: roastTemp, log: `[KILN RST-01]: Roast profile development complete. Turning off gas burner at ${roastTemp}°C.` },
      { step: 6, temp: 55, log: "[KILN RST-01]: Discharging batch to cooling tray. Spinning sweep and suction fans active... (55°C)" },
      { step: 7, temp: 25, log: "[KILN RST-01]: Roasting batch completed and cooled. Allocating FIFO lot tags to inventory." }
    ];

    if (roastStep < stages.length) {
      timer = setTimeout(() => {
        const stage = stages[roastStep];
        setSimTemp(stage.temp);
        setRoastStepsLogs(prev => [...prev, stage.log]);
        setRoastStep(prev => prev + 1);
      }, 1000);
    } else {
      // Completed, push actual lot to state
      const targetRecipe = recipes.find(r => r.id === roastRecipeId);
      const inputSku = items.find(i => i.id === roastInputItemId)?.sku || "BEAN";
      const generatedBatchNo = `RST-${inputSku}-${new Date().toISOString().slice(2,10).replace(/-/g,"")}`;
      
      const res = addRoastingJob({
        jobDate: new Date().toISOString().split("T")[0],
        batchNumber: generatedBatchNo,
        recipeId: roastRecipeId,
        recipeName: targetRecipe ? (isAr ? targetRecipe.nameAr : targetRecipe.name) : "Formula Roast",
        inputItemId: roastInputItemId,
        inputQuantity: roastInputQty,
        outputItemId: roastOutputItemId,
        outputQuantity: roastOutputQty,
        roastTimeMinutes: roastTime,
        tempCelsius: roastTemp,
        status: JobStatus.Completed,
        workerName: roastWorker
      });

      if (res.success) {
        setIsRoasting(false);
        setRoastStep(0);
        addToast({
          type: "success",
          message: `اكتمل التحميص! تم إصدار وجبة بن محمص جديدة بالرمز ${generatedBatchNo} بوزن صافي ${roastOutputQty} كجم`,
          messageEn: `Roasting complete! Registered Roasted lot: ${generatedBatchNo} with weight: ${roastOutputQty}kg`
        });
      } else {
        setRoastError(res.error || "Batch registration failed.");
        setIsRoasting(false);
      }
    }

    return () => clearTimeout(timer);
  }, [isRoasting, roastStep]);

  // Handle Grinding trigger
  const handleGrindSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGrindError(null);
    setGrindSuccess(null);

    const res = addGrindingJob({
      jobDate: new Date().toISOString().split("T")[0],
      inputBatchNumber: grindInputBatchNo,
      inputItemId: grindInputItemId,
      inputQuantity: grindInputQty,
      outputItemId: grindOutputItemId,
      outputQuantity: grindOutputQty,
      status: JobStatus.Completed
    });

    if (res.success) {
      setGrindSuccess(
        isAr 
          ? `نجاح: تم طحن كمية البن المحمصة المحددة بنسبة هدر ضئيلة للغاية. تم توفير ${grindOutputQty} كجم من البن المطحون الناعم.`
          : `Mill run completed! Roasted beans ground into ${grindOutputQty}kg fine powder.`
      );
      setGrindInputBatchNo("");
      setGrindInputItemId("");
      setGrindOutputItemId("");
      addToast({
        type: "success",
        message: "تم تشغيل الطاحونة وتحديث المخزون وقيد الاستهلاك بنجاح",
        messageEn: "Industrial mill processed roasted beans into ground powder"
      });
    } else {
      setGrindError(res.error || "Failed grinding.");
    }
  };

  // Handle Packaging trigger
  const handlePackageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPackError(null);
    setPackSuccess(null);

    const res = addPackagingJob({
      jobDate: new Date().toISOString().split("T")[0],
      inputBatchNumber: packInputBatchNo,
      inputItemId: packInputItemId,
      inputQuantity: packInputQty,
      packagingItemId: packPouchItemId,
      packagingQtyUsed: packFinishedQty, // 1 bag per box
      finishedItemId: packFinishedItemId,
      finishedQty: packFinishedQty,
      status: JobStatus.Completed
    });

    if (res.success) {
      setPackSuccess(
        isAr 
          ? `نجاح: تم سحب القهوة المطحونة وتعبئتها آلياً بالتوافق مع الموازين المعيارية. تم إنتاج وتغليف ${packFinishedQty} عبوة جاهزة للبيع.`
          : `Conveyor run completed! Packaged powder into ${packFinishedQty} labeled pouches.`
      );
      setPackInputBatchNo("");
      setPackInputItemId("");
      setPackPouchItemId("");
      setPackFinishedItemId("");
      addToast({
        type: "success",
        message: "تم تعبئة الأكياس وتوليد الباركود وتجهيز المنتجات للبيع بالتجزئة",
        messageEn: "Packaging completed, finished products ready for checkout and retail"
      });
    } else {
      setPackError(res.error || "Failed packaging conveyor.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Standardized Page Header */}
      <PageHeader
        title="صالة الإنتاج وخطوط التصنيع والتعبئة"
        titleEn="Manufacturing & Packaging Operations"
        description="إدارة معايير الخلطات (BOM)، محاكاة التحميص، مطحنة البن الصناعية، وخط التعبئة والتغليف."
        descriptionEn="Recipe formulas (BOM), rotary roasting simulation, industrial grinding mills, and automatic packaging conveyors."
        icon={Cpu}
        breadcrumbs={[
          { label: "الإنتاج والتصنيع", labelEn: "Manufacturing & Production" },
          { 
            label: activeSubTab === "recipes" ? "معايير الخلطات والوصفات" :
                   activeSubTab === "roasting" ? "محمصة البن التوربينية" :
                   activeSubTab === "grinding" ? "طاحونة الحبوب الصناعية" : "خط التعبئة والتغليف",
            labelEn: activeSubTab === "recipes" ? "Recipe Formulas" :
                     activeSubTab === "roasting" ? "Roasting Kiln" :
                     activeSubTab === "grinding" ? "Grinding Mill" : "Packaging Line",
            active: true 
          }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={() => {
          if (activeSubTab === "recipes") setShowAddRecipe(true);
        }}
        newLabelAr={activeSubTab === "recipes" ? "إضافة تركيبة خلطة جديدة" : undefined}
        newLabelEn={activeSubTab === "recipes" ? "New Recipe Formula" : undefined}
        totalCount={recipes.length}
        pageId="production"
        language={language}
      />

      {/* Standardized Secondary Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab("recipes")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "recipes" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "معايير الخلطات والوصفات" : "Recipe Formulas"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("roasting")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "roasting" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "محمصة البن التوربينية" : "Roasting Kiln"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("grinding")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "grinding" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "طاحونة الحبوب الصناعية" : "Grinding Mill"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("packaging")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "packaging" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "خط التعبئة والتغليف" : "Packaging Line"}
        </button>
      </div>

      {/* 1. Recipe Formulas Tab */}
      {activeSubTab === "recipes" && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {isAr ? "معايير تركيب خلطات القهوة والبهارات المعتمدة" : "Standard Blending & Recipe Formulas"}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr 
                  ? "تحدد المكونات والكميات المعيارية المطلوبة من المواد الخام لإنتاج عبوة واحدة جاهزة للبيع" 
                  : "Defines raw ingredient allocations and weight targets per finished retail package unit."
                }
              </p>
            </div>
            <button
              onClick={() => setShowAddRecipe(!showAddRecipe)}
              className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-lg transition"
            >
              {isAr ? "تعريف تركيبة خلطة جديدة" : "Define Recipe Formula"}
            </button>
          </div>

          {showAddRecipe && (
            <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm space-y-4 animate-fade-in text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {isAr ? "تحرير مواصفات خلطة المصنع" : "Formulate Raw Blending Ratios"}
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "الاسم التجاري بالإنجليزية" : "English Name *"}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Cardamom Gold Blend" 
                    value={recName} 
                    onChange={(e)=>setRecName(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "الاسم التجاري بالعربية" : "Arabic Name *"}</label>
                  <input 
                    type="text" 
                    placeholder="مثال: خلطة البن الشيوخي بالهيل والزعفران" 
                    value={recNameAr} 
                    onChange={(e)=>setRecNameAr(e.target.value)} 
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "خطوات التصنيع وتعليمات الطحن" : "Manufacturing Blending Steps"}</label>
                <textarea 
                  placeholder={isAr ? "توجيهات لعمال الفرن بخصوص درجات حرارة الحرق ونسب الطحن والمقادير..." : "Roasting development targets, temperature schedule, and packaging instructions..."} 
                  value={recDescription} 
                  onChange={(e)=>setRecDescription(e.target.value)} 
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white h-24" 
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowAddRecipe(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-semibold"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button 
                  onClick={()=>{
                    if (!recName.trim() || !recNameAr.trim()) {
                      addToast({ type: "warning", message: "يرجى تعبئة الحقول الأساسية", messageEn: "Please fill names" });
                      return;
                    }
                    recipes.push({
                      id: `rec-${recipes.length + 1}`,
                      name: recName,
                      nameAr: recNameAr,
                      description: recDescription,
                      outputItemId: "item-11",
                      outputItemName: "Novaro Cardamom Coffee Pouch 250g",
                      rawMaterials: []
                    });
                    setShowAddRecipe(false);
                    addToast({ type: "success", message: "تم تسجيل معايير الوصفة الجديدة بنجاح", messageEn: "Registered new recipe formula successfully" });
                  }} 
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition"
                >
                  {isAr ? "حفظ وإدراج الوصفة" : "Save Formula"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-700 uppercase">{recipe.id}</span>
                      <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{isAr ? recipe.nameAr : recipe.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium font-sans block mt-0.5">{isAr ? recipe.name : recipe.nameAr}</span>
                    </div>
                    <span className="text-[9px] bg-teal-50 border border-teal-150 text-teal-700 px-2 py-0.5 rounded-full font-bold">
                      {isAr ? "نشط بالمصنع" : "Factory Active"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{recipe.description}</p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    {isAr ? "نسب خلط المواد الخام (لكل كيس):" : "Material Blending Allocation per Unit:"}
                  </span>
                  <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-150">
                    {recipe.rawMaterials.map((mat, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>• {isAr ? items.find(i => i.id === mat.itemId)?.nameAr || mat.itemName : mat.itemName}</span>
                        <span className="font-mono font-bold text-slate-800">{mat.quantity} كجم</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Roasting Kiln Workstation */}
      {activeSubTab === "roasting" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          
          {/* Workstation setup controller */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Coffee className="w-5 h-5 text-amber-700" />
              {isAr ? "معايرة مشعل المحمصة" : "Roaster Kiln Burner Controls"}
            </h3>
            
            <form onSubmit={startRoastingCycle} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "اختر خلطة المعالجة" : "Blend Target Profile"}</label>
                <select
                  value={roastRecipeId}
                  onChange={(e) => handleRecipeChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                  required
                >
                  <option value="">{isAr ? "-- اختر خلطة بن محمصة --" : "-- Choose Blend --"}</option>
                  {recipes.map(r => <option key={r.id} value={r.id}>{isAr ? r.nameAr : r.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "مخزن البن الخام المستهلك" : "Green Bean Batch Source"}</label>
                <select
                  value={roastInputItemId}
                  onChange={(e) => setRoastInputItemId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                  required
                >
                  <option value="">{isAr ? "-- اختر صنف البن الأخضر --" : "-- Select Green Beans --"}</option>
                  {rawMaterials.map(i => (
                    <option key={i.id} value={i.id}>
                      {isAr ? i.nameAr : i.name} ({isAr ? `رصيد متاح: ${i.currentStock}` : `Stock: ${i.currentStock}`} كجم)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "الصنف النهائي المحمص" : "Roasted Output SKU Target"}</label>
                <select
                  value={roastOutputItemId}
                  onChange={(e) => setRoastOutputItemId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                  required
                >
                  <option value="">{isAr ? "-- صنف البن المحمص المستهدف --" : "-- Roasted Target --"}</option>
                  {roastedMaterials.map(i => <option key={i.id} value={i.id}>{isAr ? i.nameAr : i.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "وزن الشحنة (كجم)" : "Green Weight (kg)"}</label>
                  <input
                    type="number"
                    value={roastInputQty || ""}
                    onChange={(e)=>setRoastInputQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "الوزن المحمص المتوقع" : "Expected Roasted Weight"}</label>
                  <input
                    type="number"
                    value={roastOutputQty || ""}
                    onChange={(e)=>setRoastOutputQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "حرارة الفرن المعيارية" : "Heat Target (°C)"}</label>
                  <input
                    type="number"
                    value={roastTemp}
                    onChange={(e)=>setRoastTemp(parseInt(e.target.value) || 205)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-500 block">{isAr ? "زمن التحميص (دقيقة)" : "Duration (Mins)"}</label>
                  <input
                    type="number"
                    value={roastTime}
                    onChange={(e)=>setRoastTime(parseFloat(e.target.value) || 15)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  />
                </div>
              </div>

              {roastError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-semibold rounded-lg">
                  {roastError}
                </div>
              )}

              <button
                type="submit"
                disabled={isRoasting}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Flame className="w-4 h-4 animate-pulse" />
                <span>{isAr ? "إطلاق مشعل المعالجة" : "Engage Burners & Start"}</span>
              </button>
            </form>
          </div>

          {/* Active kiln telemetry monitor */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col justify-between min-h-[400px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isAr ? "لوحة التتبع الحراري التلقائي" : "Roaster Kiln Digital Telemetry Monitor"}
                </h3>
                <p className="text-[10px] text-slate-500">
                  {isAr ? "رصد حساسات الحرارة ومسار تبخر الرطوبة الفوري بالمحمص رقم 01" : "Active temperature probes and moisture extraction logs for Kiln #01"}
                </p>
              </div>
              <span className="text-[10px] font-mono bg-slate-900 text-amber-400 px-2.5 py-1 rounded-md font-bold">
                PROBE KILN-01
              </span>
            </div>

            {isRoasting ? (
              <div className="flex-1 py-5 flex flex-col justify-between space-y-4">
                
                {/* Dial indicator and statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gauge */}
                  <div className="flex flex-col items-center justify-center border border-slate-150 p-4 rounded-xl bg-slate-50">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{isAr ? "درجة حرارة الحساس" : "HEAT PROBE TEMPERATURE"}</span>
                    <span className="text-3xl font-mono font-black text-amber-600 mt-1">{simTemp}°م</span>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3 max-w-[150px]">
                      <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${(simTemp / 240) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Worker Card */}
                  <div className="p-4 border border-slate-150 rounded-xl bg-slate-50 flex flex-col justify-between text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{isAr ? "عامل التشغيل المسؤول" : "Responsible Operator"}</span>
                      <p className="font-extrabold text-slate-800 text-sm mt-0.5">{roastWorker}</p>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-500">
                      {isAr ? `توقع الوزن المفقود: ${(((roastInputQty - roastOutputQty)/roastInputQty)*100).toFixed(1)}%` : `Weight Loss Forecast: ${(((roastInputQty - roastOutputQty)/roastInputQty)*100).toFixed(1)}%`}
                    </div>
                  </div>
                </div>

                {/* Progress Logs list */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 shadow-inner h-44 overflow-y-auto font-mono text-[10px] text-teal-300 space-y-1.5">
                  {roastStepsLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("Crack") || log.includes("طقطقة") ? "text-amber-400 font-extrabold flex items-center gap-1" : "flex items-center gap-1"}>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-12 text-center space-y-2">
                <Flame className="w-10 h-10 text-slate-300 animate-pulse" />
                <p className="text-xs font-bold text-slate-500">{isAr ? "محمصة القهوة مغلقة ومستقرة حالياً" : "Roasting Kiln is Idle & Stable"}</p>
                <p className="text-[10px] text-slate-400 max-w-sm">
                  {isAr 
                    ? "اختر صنف البن الأخضر ووزن الشحنة من القائمة الجانبية لبدء تشغيل دورة التحميص وتسجيل قراءات الوجبة آلياً" 
                    : "Configure recipe parameters and raw inventory selections on the left to fire up the burner and generate EAN-13 FIFO lots."
                  }
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. Grinding Mill Station Tab */}
      {activeSubTab === "grinding" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 max-w-3xl mx-auto animate-fade-in text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "طحن حبوب البن المحمصة" : "Grinding Mill Station"}</h3>
            <p className="text-[10px] text-slate-500">
              {isAr ? "تحويل دفعات البن الكاملة المحمصة إلى بن مطحون ناعم مع معالجة نسب الاستهلاك" : "Process roasted whole beans lot into raw ground coffee powder."}
            </p>
          </div>

          <form onSubmit={handleGrindSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "رقم الوجبة المحمصة للبن (FIFO)" : "Roasted Lot Number (FIFO)"}</label>
              <input
                type="text"
                placeholder="e.g. RST-BEAN-260709"
                value={grindInputBatchNo}
                onChange={(e)=>setGrindInputBatchNo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-center"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "صنف البن المحمص الأصلي" : "Roasted Material Code"}</label>
              <select
                value={grindInputItemId}
                onChange={(e)=>setGrindInputItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                required
              >
                <option value="">{isAr ? "-- اختر الصنف المحمص --" : "-- Choose Item --"}</option>
                {roastedMaterials.map(i => <option key={i.id} value={i.id}>{isAr ? i.nameAr : i.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "البن المطحون المستهدف" : "Target Ground SKU"}</label>
              <select
                value={grindOutputItemId}
                onChange={(e)=>setGrindOutputItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                required
              >
                <option value="">{isAr ? "-- صنف البن المطحون المستهدف --" : "-- Choose Ground Item --"}</option>
                {groundMaterials.map(i => <option key={i.id} value={i.id}>{isAr ? i.nameAr : i.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "وزن البن المحمص المستهلك" : "Input Beans (kg)"}</label>
                <input
                  type="number"
                  value={grindInputQty || ""}
                  onChange={(e)=>setGrindInputQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "وزن البن المطحون الصافي" : "Output Powder (kg)"}</label>
                <input
                  type="number"
                  value={grindOutputQty || ""}
                  onChange={(e)=>setGrindOutputQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  required
                />
              </div>
            </div>

            {grindError && <div className="md:col-span-2 p-3 bg-rose-50 text-rose-700 font-semibold border border-rose-150 rounded-lg">{grindError}</div>}
            {grindSuccess && <div className="md:col-span-2 p-3 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-150 rounded-lg">{grindSuccess}</div>}

            <div className="md:col-span-2 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs"
              >
                <Hammer className="w-4 h-4" />
                <span>{isAr ? "بدء تشغيل المطحنة الصناعية" : "Run Grinding Mill"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Packaging Station Tab */}
      {activeSubTab === "packaging" && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5 max-w-3xl mx-auto animate-fade-in text-xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "خط التعبئة والتغليف النهائي" : "Conveyor Packaging Line"}</h3>
            <p className="text-[10px] text-slate-500">
              {isAr ? "تعبئة البن المطحون في أكياس الألمنيوم وتوليد العبوات التجارية النهائية المرفق معها الباركود" : "Package processed ground powder and aluminum pouch foil into ready wholesale products."}
            </p>
          </div>

          <form onSubmit={handlePackageSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "رقم وجبة البن المطحون (FIFO)" : "Ground Powder Lot Number (FIFO)"}</label>
              <input
                type="text"
                placeholder="e.g. G-RST-ETH-M260709"
                value={packInputBatchNo}
                onChange={(e)=>setPackInputBatchNo(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 font-mono text-center"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "صنف البن المطحون الأصلي" : "Ground Material Code"}</label>
              <select
                value={packInputItemId}
                onChange={(e)=>setPackInputItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                required
              >
                <option value="">{isAr ? "-- اختر صنف البن المطحون --" : "-- Select Ground --"}</option>
                {groundMaterials.map(i => <option key={i.id} value={i.id}>{isAr ? i.nameAr : i.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "صنف كيس/ألمنيوم التغليف" : "Pouch Foil Packing SKU"}</label>
              <select
                value={packPouchItemId}
                onChange={(e)=>setPackPouchItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                required
              >
                <option value="">{isAr ? "-- اختر مادة التعبئة والتغليف --" : "-- Choose Pouch --"}</option>
                {pouchMaterials.map(i => (
                  <option key={i.id} value={i.id}>
                    {isAr ? i.nameAr : i.name} ({isAr ? `المخزون المتاح: ${i.currentStock}` : `Stock: ${i.currentStock}`} قطعة)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "المنتج التجاري النهائي الجاهز" : "Finished Retail Product SKU"}</label>
              <select
                value={packFinishedItemId}
                onChange={(e)=>setPackFinishedItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none"
                required
              >
                <option value="">{isAr ? "-- صنف المنتج النهائي للبيع --" : "-- Choose Product --"}</option>
                {finishedProducts.map(i => <option key={i.id} value={i.id}>{isAr ? i.nameAr : i.name}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "وزن البن المطحون المستهلك (كجم)" : "Input Ground Weight (kg)"}</label>
                <input
                  type="number"
                  value={packInputQty || ""}
                  onChange={(e)=>setPackInputQty(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-slate-500 block">{isAr ? "عدد الأكياس الجاهزة المنتجة" : "Finished Pouches Count (pcs)"}</label>
                <input
                  type="number"
                  value={packFinishedQty || ""}
                  onChange={(e)=>setPackFinishedQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                  required
                />
              </div>
            </div>

            {packError && <div className="md:col-span-2 p-3 bg-rose-50 text-rose-700 font-semibold border border-rose-150 rounded-lg">{packError}</div>}
            {packSuccess && <div className="md:col-span-2 p-3 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-150 rounded-lg">{packSuccess}</div>}

            <div className="md:col-span-2 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isAr ? "تشغيل سير التعبئة والتغليف" : "Run Conveyor & Box Products"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
