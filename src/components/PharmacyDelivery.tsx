import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, ChevronLeft, ChevronRight, Clock3, CreditCard, MapPin,
  Minus, PackageCheck, Phone, Pill, Plus, Search, ShieldCheck,
  ShoppingBag, ShoppingCart, Star, Store, Trash2, Truck,
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useApp } from "../contexts/AppContext";
import { api } from "../services/api";
import { useAsyncData } from "../hooks/useAsyncData";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

interface Medication {
  id: string;
  name: string;
  dosage: string;
  price: number;
  inStock: boolean;
  prescriptionRequired: boolean;
}

interface Pharmacy {
  id: string;
  name: string;
  rating: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  address: string;
  phone: string;
  medications: Medication[];
}

interface CartItem {
  medication: Medication;
  quantity: number;
  pharmacyId: string;
}

export function PharmacyDelivery() {
  const { dir, language } = useApp();
  const ar = language === "ar";
  const Arrow = ar ? ChevronLeft : ChevronRight;
  const [selectedPharmacyId, setSelectedPharmacyId] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("cash");
  const [ordering, setOrdering] = useState(false);
  const { data, isLoading, error } = useAsyncData(() => api.pharmacies(), []);

  const pharmacies: Pharmacy[] = useMemo(() => (data || []).map((pharmacy: any) => ({
    id: pharmacy._id,
    name: pharmacy.name,
    rating: pharmacy.rating || 0,
    deliveryTime: pharmacy.deliveryTime || (ar ? "30-45 دقيقة" : "30-45 min"),
    deliveryFee: pharmacy.deliveryFee || 0,
    minOrder: pharmacy.minOrder || 0,
    address: pharmacy.address || "",
    phone: pharmacy.phone || "",
    medications: (pharmacy.medications || []).map((medication: any) => ({
      id: medication._id,
      name: medication.name,
      dosage: medication.dosage,
      price: medication.price,
      inStock: medication.inStock,
      prescriptionRequired: medication.prescriptionRequired,
    })),
  })), [data, ar]);

  useEffect(() => {
    if (!selectedPharmacyId && pharmacies[0]) setSelectedPharmacyId(pharmacies[0].id);
  }, [pharmacies, selectedPharmacyId]);

  const selectedPharmacy = pharmacies.find((pharmacy) => pharmacy.id === selectedPharmacyId) || null;
  const filteredMedications = (selectedPharmacy?.medications || []).filter((medication) =>
    `${medication.name} ${medication.dosage}`.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );
  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.medication.price * item.quantity, 0);
  const deliveryFee = cart.length ? pharmacies.find((pharmacy) => pharmacy.id === cart[0].pharmacyId)?.deliveryFee || 0 : 0;
  const total = subtotal + deliveryFee;

  function choosePharmacy(pharmacy: Pharmacy) {
    if (cart.length && cart[0].pharmacyId !== pharmacy.id) {
      toast.error(ar ? "أكمل طلب الصيدلية الحالية أو أفرغ السلة أولاً" : "Finish the current order or clear the cart first");
      return;
    }
    setSelectedPharmacyId(pharmacy.id);
    setSearchQuery("");
  }

  function addToCart(medication: Medication) {
    if (!selectedPharmacy || !medication.inStock) return;
    setCart((items) => {
      const existing = items.find((item) => item.medication.id === medication.id);
      return existing
        ? items.map((item) => item.medication.id === medication.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { medication, quantity: 1, pharmacyId: selectedPharmacy.id }];
    });
    toast.success(ar ? `تمت إضافة ${medication.name} إلى السلة` : `${medication.name} added to cart`);
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) setCart((items) => items.filter((item) => item.medication.id !== id));
    else setCart((items) => items.map((item) => item.medication.id === id ? { ...item, quantity } : item));
  }

  async function handleCheckout() {
    if (!cart.length) return toast.error(ar ? "السلة فارغة" : "Your cart is empty");
    if (deliveryAddress.trim().length < 5) return toast.error(ar ? "اكتب عنوان توصيل واضحًا" : "Enter a valid delivery address");
    setOrdering(true);
    try {
      const order = await api.createOrder({
        pharmacy: cart[0].pharmacyId,
        items: cart.map((item) => ({ medication: item.medication.id, quantity: item.quantity })),
        deliveryAddress: deliveryAddress.trim(),
        paymentMethod,
      });
      toast.success(ar ? `تم تأكيد الطلب بقيمة ${order.total} جنيه` : `Order confirmed: EGP ${order.total}`);
      setCart([]); setDeliveryAddress(""); setShowCart(false);
    } catch (checkoutError) {
      toast.error(checkoutError instanceof Error ? checkoutError.message : (ar ? "تعذر تأكيد الطلب" : "Unable to place order"));
    } finally { setOrdering(false); }
  }

  return <div className="pharmacy-v2" dir={dir}>
    <header className="pharmacy-v2-head">
      <div><span>{ar ? "صيدليتك أقرب" : "Your pharmacy, closer"}</span><h2>{ar ? "اطلب دواءك بسهولة" : "Order medication easily"}</h2><p>{ar ? "اختر الصيدلية، أضف الأدوية، وتابع ملخص طلبك بخطوات واضحة." : "Choose a pharmacy, add medications and review your order in clear steps."}</p></div>
      <button className="pharmacy-cart-button" onClick={() => setShowCart(true)}><ShoppingCart /><span>{ar ? "السلة" : "Cart"}</span>{cartItemsCount > 0 && <b>{cartItemsCount}</b>}</button>
    </header>

    <section className="pharmacy-steps" aria-label={ar ? "خطوات الطلب" : "Order steps"}>
      <div className="active"><span>1</span><p><b>{ar ? "اختر الصيدلية" : "Choose pharmacy"}</b><small>{ar ? "حسب الوقت والتقييم" : "By time and rating"}</small></p></div><Arrow />
      <div className={selectedPharmacy ? "active" : ""}><span>2</span><p><b>{ar ? "أضف الدواء" : "Add medication"}</b><small>{ar ? "ابحث واختر الكمية" : "Search and set quantity"}</small></p></div><Arrow />
      <div className={cart.length ? "active" : ""}><span>3</span><p><b>{ar ? "أكد الطلب" : "Confirm order"}</b><small>{ar ? "العنوان وطريقة الدفع" : "Address and payment"}</small></p></div>
    </section>

    <div className="pharmacy-layout">
      <aside className="pharmacy-picker">
        <header><div><Store /><span><b>{ar ? "الصيدليات المتاحة" : "Available pharmacies"}</b><small>{pharmacies.length} {ar ? "صيدلية" : "pharmacies"}</small></span></div></header>
        <div className="pharmacy-picker-list">
          {isLoading && <div className="pharmacy-state"><div className="loading-spinner" /><p>{ar ? "جاري تحميل الصيدليات..." : "Loading pharmacies..."}</p></div>}
          {error && <div className="pharmacy-state error"><p>{error}</p></div>}
          {!isLoading && !error && !pharmacies.length && <div className="pharmacy-state"><Store /><p>{ar ? "لا توجد صيدليات متاحة حاليًا" : "No pharmacies are available"}</p></div>}
          {pharmacies.map((pharmacy) => <button key={pharmacy.id} className={selectedPharmacyId === pharmacy.id ? "selected" : ""} onClick={() => choosePharmacy(pharmacy)}>
            <span className="pharmacy-logo"><ShoppingBag /></span>
            <span className="pharmacy-option-info"><b>{pharmacy.name}</b><small><Star />{pharmacy.rating} <i>•</i> <Clock3 />{pharmacy.deliveryTime}</small><small><Truck />{pharmacy.deliveryFee ? `${pharmacy.deliveryFee} ${ar ? "ج.م" : "EGP"}` : (ar ? "توصيل مجاني" : "Free delivery")}</small></span>
            <i className="pharmacy-radio"><CheckCircle2 /></i>
          </button>)}
        </div>
      </aside>

      <main className="pharmacy-catalog">
        {selectedPharmacy ? <>
          <section className="selected-pharmacy-bar">
            <div className="selected-pharmacy-title"><span><ShoppingBag /></span><div><small>{ar ? "تتسوق الآن من" : "Shopping from"}</small><h3>{selectedPharmacy.name}</h3></div></div>
            <div className="selected-pharmacy-meta"><span><Clock3 />{selectedPharmacy.deliveryTime}</span><span><MapPin />{selectedPharmacy.address}</span>{selectedPharmacy.phone && <a href={`tel:${selectedPharmacy.phone}`}><Phone />{selectedPharmacy.phone}</a>}</div>
          </section>

          <div className="pharmacy-search"><Search /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={ar ? "ابحث باسم الدواء أو التركيز..." : "Search by medication or dosage..."} />{searchQuery && <button onClick={() => setSearchQuery("")}>{ar ? "مسح" : "Clear"}</button>}</div>

          <div className="medication-results-head"><div><h3>{ar ? "الأدوية المتاحة" : "Available medications"}</h3><p>{filteredMedications.length} {ar ? "نتيجة" : "results"}</p></div><span><ShieldCheck />{ar ? "مصادر موثوقة" : "Verified supply"}</span></div>

          <div className="pharmacy-products">
            {filteredMedications.map((medication) => {
              const inCart = cart.find((item) => item.medication.id === medication.id);
              return <article key={medication.id} className={!medication.inStock ? "unavailable" : ""}>
                <div className="medication-visual"><Pill /></div>
                <div className="medication-copy"><div className="medication-flags"><span className={medication.inStock ? "stock" : "out"}>{medication.inStock ? (ar ? "متوفر" : "In stock") : (ar ? "غير متوفر" : "Out of stock")}</span>{medication.prescriptionRequired && <span className="rx">Rx · {ar ? "يحتاج روشتة" : "Prescription"}</span>}</div><h4>{medication.name}</h4><p>{medication.dosage}</p></div>
                <div className="medication-buy"><b>{medication.price}<small>{ar ? " ج.م" : " EGP"}</small></b>{inCart ? <div className="inline-quantity"><button onClick={() => updateQuantity(medication.id, inCart.quantity - 1)}><Minus /></button><span>{inCart.quantity}</span><button onClick={() => updateQuantity(medication.id, inCart.quantity + 1)}><Plus /></button></div> : <button disabled={!medication.inStock} onClick={() => addToCart(medication)}><Plus />{ar ? "أضف للسلة" : "Add to cart"}</button>}</div>
              </article>;
            })}
            {!filteredMedications.length && <div className="pharmacy-empty"><span><Search /></span><h3>{ar ? "لم نجد هذا الدواء" : "No medication found"}</h3><p>{ar ? "جرّب كتابة اسم مختلف أو امسح البحث." : "Try another name or clear the search."}</p></div>}
          </div>
        </> : <div className="pharmacy-empty full"><span><Store /></span><h3>{ar ? "اختر صيدلية للبدء" : "Choose a pharmacy to start"}</h3><p>{ar ? "ستظهر الأدوية المتاحة هنا مباشرة." : "Available medications will appear here."}</p></div>}
      </main>

      <aside className="cart-preview">
        <header><div><ShoppingCart /><span><b>{ar ? "ملخص السلة" : "Cart summary"}</b><small>{cartItemsCount} {ar ? "منتج" : "items"}</small></span></div>{cart.length > 0 && <button onClick={() => setCart([])}><Trash2 />{ar ? "تفريغ" : "Clear"}</button>}</header>
        <div className="cart-preview-items">
          {!cart.length ? <div className="cart-empty"><span><ShoppingCart /></span><h4>{ar ? "السلة فارغة" : "Cart is empty"}</h4><p>{ar ? "أضف دواءً وسيظهر ملخصه هنا." : "Add medication to see the summary."}</p></div> : cart.map((item) => <article key={item.medication.id}><span><Pill /></span><div><b>{item.medication.name}</b><small>{item.medication.dosage}</small><p>{item.medication.price * item.quantity} {ar ? "ج.م" : "EGP"}</p></div><div className="cart-mini-quantity"><button onClick={() => updateQuantity(item.medication.id, item.quantity - 1)}><Minus /></button><b>{item.quantity}</b><button onClick={() => updateQuantity(item.medication.id, item.quantity + 1)}><Plus /></button></div></article>)}
        </div>
        <footer><p><span>{ar ? "الإجمالي الفرعي" : "Subtotal"}</span><b>{subtotal} {ar ? "ج.م" : "EGP"}</b></p><p><span>{ar ? "التوصيل" : "Delivery"}</span><b>{deliveryFee ? `${deliveryFee} ${ar ? "ج.م" : "EGP"}` : (ar ? "مجاني" : "Free")}</b></p><div><span>{ar ? "الإجمالي" : "Total"}</span><b>{total} {ar ? "ج.م" : "EGP"}</b></div><button disabled={!cart.length} onClick={() => setShowCart(true)}>{ar ? "إتمام الطلب" : "Checkout"}<Arrow /></button></footer>
      </aside>
    </div>

    <Dialog open={showCart} onOpenChange={setShowCart}>
      <DialogContent className="pharmacy-checkout" dir={dir}>
        <DialogHeader><DialogTitle>{ar ? "تأكيد طلبك" : "Confirm your order"}</DialogTitle><DialogDescription>{ar ? "راجع المنتجات وأضف عنوان التوصيل وطريقة الدفع." : "Review items, delivery address and payment."}</DialogDescription></DialogHeader>
        <div className="checkout-body">
          {!cart.length ? <div className="checkout-empty"><ShoppingCart /><h3>{ar ? "السلة فارغة" : "Your cart is empty"}</h3><p>{ar ? "أضف دواءً أولاً ثم ارجع لإتمام الطلب." : "Add medication first, then return to checkout."}</p></div> : <div className="checkout-items">{cart.map((item) => <article key={item.medication.id}><span><Pill /></span><div><b>{item.medication.name}</b><small>{item.medication.dosage} · {ar ? "الكمية" : "Qty"}: {item.quantity}</small></div><strong>{item.medication.price * item.quantity} {ar ? "ج.م" : "EGP"}</strong></article>)}</div>}
          {cart.length > 0 && <><label className="checkout-field"><span><MapPin />{ar ? "عنوان التوصيل" : "Delivery address"}</span><textarea rows={3} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder={ar ? "المنطقة، الشارع، رقم المبنى والدور..." : "Area, street, building and floor..."} /></label><div className="payment-picker"><span>{ar ? "طريقة الدفع" : "Payment method"}</span><div><button className={paymentMethod === "cash" ? "active" : ""} onClick={() => setPaymentMethod("cash")}><Truck />{ar ? "الدفع عند الاستلام" : "Cash on delivery"}</button><button className={paymentMethod === "card" ? "active" : ""} onClick={() => setPaymentMethod("card")}><CreditCard />{ar ? "بطاقة بنكية" : "Bank card"}</button></div></div><div className="checkout-total"><span>{ar ? "الإجمالي شامل التوصيل" : "Total including delivery"}</span><b>{total} {ar ? "ج.م" : "EGP"}</b></div><button className="checkout-submit" disabled={ordering} onClick={handleCheckout}><PackageCheck />{ordering ? (ar ? "جارٍ تأكيد الطلب..." : "Placing order...") : (ar ? "تأكيد وإرسال الطلب" : "Place order")}</button></>}
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
