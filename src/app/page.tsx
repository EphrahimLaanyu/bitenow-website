import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CheckCircle2,
  ChefHat,
  Clock3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Menu,
  ShoppingBag,
  Star,
  Utensils
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const services = [
  { icon: Building2, title: "Hotel discovery", copy: "Guests find the right hotel and start ordering without confusion." },
  { icon: Menu, title: "Live menus", copy: "Beautiful menu browsing with categories, images, availability, and pricing." },
  { icon: Bell, title: "Order updates", copy: "Notifications and tracking keep guests informed from kitchen to table." }
];

const benefits = [
  "Fast ordering from phone or desktop",
  "Clear order progress and confirmation",
  "One place for cart, checkout, orders, and profile"
];

const restaurants = ["The Grand Meridian", "Harbor Table", "Orange Hearth"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#fafbfc] text-[#101f3f] selection:bg-[#f97316] selection:text-white">
      {/* HEADER - Styled as previously established */}
      <header className="sticky top-0 z-50 w-full border-b border-[#101f3f]/5 bg-white/80 px-5 py-4 antialiased backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link className="group flex items-center gap-3" href="/">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#101f3f]/10 bg-[#101f3f]/[0.03] text-[#101f3f] shadow-[inset_0_1px_1px_rgba(255,255,255,1)] transition-all duration-500 ease-out group-hover:rotate-12 group-hover:scale-105 group-hover:border-[#f97316]/20 group-hover:bg-[#f97316]/10 group-hover:text-[#f97316]">
              <Utensils aria-hidden size={18} />
            </span>
            <span className="brand-logo text-xl font-bold tracking-tight text-[#101f3f] transition-opacity group-hover:opacity-90">
              Bite<span className="text-[#f97316] transition-colors duration-500 group-hover:text-[#101f3f]">Now</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-9 lg:flex">
            <a className="text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]" href="#services">Services</a>
            <a className="text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]" href="#restaurants">Restaurants</a>
            <a className="text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]" href="#menu">Menu</a>
            <a className="text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]" href="#how">How it works</a>
            <a className="text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316]" href="#contact">Contact</a>
          </nav>

          <div className="flex items-center gap-6">
            <Link className="hidden text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316] sm:inline-block" href="/login">
              Login
            </Link>
            <Link className="hidden text-[13px] font-semibold tracking-wide text-[#101f3f]/60 transition-colors duration-300 hover:text-[#f97316] sm:inline-block" href="/dashboard">
              Dashboard
            </Link>
            <Link
              className="flex h-10 items-center gap-2.5 rounded-full bg-[#101f3f] px-5 text-[13px] font-semibold tracking-wide text-white shadow-[0_4px_14px_0_rgba(16,31,63,0.15)] transition-all duration-300 ease-out hover:scale-105 hover:bg-[#f97316] hover:shadow-[0_6px_20px_rgba(249,115,22,0.25)] active:scale-95"
              href="/client/cart"
            >
              <ShoppingBag aria-hidden size={17} />
              Cart
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white px-5 pb-20 pt-16 md:px-8 md:pb-32 md:pt-24">
        {/* Subtle background glow */}
        <div className="absolute left-1/2 top-0 -z-10 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-[#f97316]/5 to-transparent blur-3xl" />
        
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.04fr_0.96fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f97316]">
              Order fast. Eat now.
            </p>
            <h1 className="mt-6 max-w-4xl text-5xl font-extrabold tracking-tight text-[#101f3f] leading-[1.05] md:text-7xl">
              Food ordering for hotels that feels <span className="text-[#f97316]">instant.</span>
            </h1>
            <p className="mt-8 max-w-xl text-[17px] leading-relaxed text-[#101f3f]/60">
              BiteNow gives guests a beautiful way to discover hotels, browse menus, place orders,
              and track every step while teams manage service from a focused dashboard.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                className="group inline-flex h-14 items-center gap-2.5 rounded-full bg-[#f97316] px-8 text-[14px] font-bold text-white shadow-[0_10px_30px_rgba(249,115,22,0.25)] transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ea6505] hover:shadow-[0_15px_40px_rgba(249,115,22,0.35)]"
                href="/client/hotels"
              >
                Start ordering
                <ArrowRight aria-hidden size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                className="inline-flex h-14 items-center gap-2.5 rounded-full border border-[#101f3f]/10 bg-white px-8 text-[14px] font-bold text-[#101f3f] transition-all duration-300 ease-out hover:border-[#101f3f]/20 hover:bg-[#f8fafc] hover:shadow-sm"
                href="/dashboard"
              >
                <LayoutDashboard aria-hidden size={18} className="text-[#101f3f]/60" />
                Staff dashboard
              </Link>
            </div>
          </div>

          {/* HERO APP UI MOCKUP */}
          <div className="relative rounded-[2.5rem] border border-[#101f3f]/5 bg-white p-2.5 shadow-[0_30px_80px_rgba(16,31,63,0.08)] transition-transform duration-700 hover:-translate-y-2">
            <div className="overflow-hidden rounded-[2rem] border border-[#101f3f]/5 bg-[#fafbfc]">
              {/* Card Header with Image */}
              <div className="relative h-40 bg-[#101f3f] p-6 text-white overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1542314831-c6a4d14db8cb?auto=format&fit=crop&q=80&w=800" 
                  alt="The Grand Meridian" 
                  className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
                />
                <div className="relative z-10 flex items-start justify-between h-full flex-col">
                  <div className="flex w-full items-center justify-between">
                    <Badge className="bg-[#f97316] text-white hover:bg-[#ea6505] px-3 py-1 text-[10px] font-bold uppercase tracking-wider border-none shadow-md">Open</Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Featured hotel</p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight">The Grand Meridian</h2>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 p-6">
                <HeroMeal title="Spiced chicken bowl" price="KES 1,250" icon={ChefHat} />
                <HeroMeal title="Citrus breakfast plate" price="KES 980" icon={Utensils} />
                <div className="mt-2 grid gap-3 sm:grid-cols-3">
                  <MiniMetric icon={Clock3} label="Avg prep" value="18 min" />
                  <MiniMetric icon={CreditCard} label="Checkout" value="Secure" />
                  <MiniMetric icon={Star} label="Rating" value="4.9" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Section id="services" label="Services" title="Everything guests need before the first bite.">
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <FeatureCard key={service.title} {...service} />
          ))}
        </div>
      </Section>

      <Section id="menu" label="Menu and promotions" title="A catalogue that is easy to scan and easy to crave.">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="group relative overflow-hidden rounded-[2.5rem] border-none bg-[#101f3f] p-10 text-white shadow-2xl transition-all hover:shadow-[0_20px_60px_rgba(16,31,63,0.3)]">
            {/* Decorative background accent */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f97316] opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-150" />
            
            <div className="relative z-10 flex h-full flex-col justify-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f97316]">For customers</p>
              <h3 className="mt-5 text-4xl font-extrabold tracking-tight leading-[1.1]">Browse, cart, checkout, track.</h3>
              <div className="mt-10 space-y-5">
                {benefits.map((benefit) => (
                  <p className="flex items-center gap-4 text-[15px] font-medium text-white/80" key={benefit}>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f97316]/20 text-[#f97316]">
                      <CheckCircle2 aria-hidden size={14} />
                    </span>
                    {benefit}
                  </p>
                ))}
              </div>
            </div>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <PromoCard title="Breakfast bundle" copy="Coffee, eggs, pastry, and fruit bowl." price="KES 1,450" />
            <PromoCard title="Chef's dinner set" copy="Starter, main, dessert, and fresh juice." price="KES 2,900" />
          </div>
        </div>
      </Section>

      <Section id="restaurants" label="Featured restaurants" title="Built for premium hotels and busy kitchens.">
        <div className="grid gap-6 md:grid-cols-3">
          {restaurants.map((restaurant, index) => {
            const images = [
              "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
              "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800"
            ];
            return (
              <Card key={restaurant} className="group overflow-hidden rounded-[2rem] border border-[#101f3f]/5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
                <div className="relative h-48 w-full overflow-hidden bg-[#101f3f]">
                  <img 
                    src={images[index]} 
                    alt={restaurant}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-extrabold tracking-tight text-[#101f3f]">{restaurant}</h3>
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#101f3f]/50">
                    <MapPin aria-hidden size={14} />
                    Nairobi, Kenya
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section id="how" label="How it works" title="Simple for guests. Powerful for teams.">
        <div className="grid gap-6 md:grid-cols-4">
          {["Choose hotel", "Browse menu", "Place order", "Track progress"].map((step, index) => (
            <Card key={step} className="group rounded-[2rem] border border-[#101f3f]/5 bg-white p-8 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:border-[#f97316]/30 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)]">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f97316]/10 text-[16px] font-extrabold text-[#f97316] transition-all duration-500 group-hover:bg-[#f97316] group-hover:text-white group-hover:scale-110">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-extrabold tracking-tight text-[#101f3f]">{step}</h3>
              <p className="mt-3 text-[14px] leading-relaxed text-[#101f3f]/60">
                A clean flow that keeps the next action obvious and fast.
              </p>
            </Card>
          ))}
        </div>
      </Section>

      <section id="contact" className="px-5 py-20 md:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[3rem] bg-[#101f3f] p-10 text-white shadow-2xl md:p-16">
          {/* Decorative mesh gradient in corner */}
          <div className="absolute -bottom-32 -right-32 h-[400px] w-[400px] rounded-full bg-[#f97316] opacity-20 blur-[80px]" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f97316]">Contact</p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl max-w-2xl">
                Ready to make ordering feel premium?
              </h2>
              <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/70 mx-auto md:mx-0">
                Start with the guest experience, then connect the operational dashboard behind it.
              </p>
            </div>
            <Link
              className="group flex h-16 shrink-0 items-center gap-3 rounded-full bg-[#f97316] px-10 text-[15px] font-bold text-white shadow-[0_10px_30px_rgba(249,115,22,0.2)] transition-all duration-300 ease-out hover:scale-105 hover:bg-[#ea6505]"
              href="/client/hotels"
            >
              Explore BiteNow
              <ArrowRight aria-hidden size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

// -------------------------------------------------------------
// HELPER COMPONENTS
// -------------------------------------------------------------

function Section({
  children,
  id,
  label,
  title
}: {
  children: React.ReactNode;
  id: string;
  label: string;
  title: string;
}) {
  return (
    <section className="px-5 py-20 md:px-8" id={id}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f97316]">{label}</p>
          <h2 className="mt-4 max-w-3xl text-3xl font-extrabold tracking-tight text-[#101f3f] md:text-5xl leading-[1.15]">
            {title}
          </h2>
        </div>
        <div className="mt-16">{children}</div>
      </div>
    </section>
  );
}

function FeatureCard({
  copy,
  icon: Icon,
  title
}: {
  copy: string;
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  title: string;
}) {
  return (
    <Card className="group rounded-[2rem] border border-[#101f3f]/5 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
      <span className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101f3f]/[0.03] text-[#101f3f] transition-colors duration-500 group-hover:bg-[#f97316] group-hover:text-white">
        <Icon aria-hidden size={24} strokeWidth={1.5} />
      </span>
      <h3 className="text-xl font-extrabold tracking-tight text-[#101f3f]">{title}</h3>
      <p className="mt-3 text-[14px] leading-relaxed text-[#101f3f]/60">{copy}</p>
    </Card>
  );
}

function HeroMeal({
  icon: Icon,
  price,
  title
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  price: string;
  title: string;
}) {
  // Map titles to gorgeous stock food images dynamically without altering props
  const imageMap: Record<string, string> = {
    "Spiced chicken bowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
    "Citrus breakfast plate": "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&q=80&w=200"
  };

  const imageUrl = imageMap[title];

  return (
    <div className="group flex items-center justify-between gap-4 rounded-[1.5rem] border border-[#101f3f]/5 bg-white p-3.5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center gap-4">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-14 w-14 rounded-[1rem] object-cover shadow-sm transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-[1rem] bg-[#101f3f]/[0.03] text-[#101f3f]">
            <Icon aria-hidden size={22} />
          </span>
        )}
        <div>
          <p className="font-bold text-[15px] tracking-tight text-[#101f3f]">{title}</p>
          <p className="text-[12px] font-semibold text-[#f97316]">Ready to order</p>
        </div>
      </div>
      <p className="pr-2 font-extrabold text-[#101f3f]">{price}</p>
    </div>
  );
}

function MiniMetric({
  icon: Icon,
  label,
  value
}: {
  icon: React.ComponentType<{ className?: string; size?: number; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#101f3f]/5 bg-white p-4 shadow-sm transition-colors hover:bg-[#fafbfc]">
      <Icon aria-hidden className="text-[#f97316] mb-2" size={20} strokeWidth={2} />
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#101f3f]/40">{label}</p>
      <p className="mt-0.5 text-[14px] font-extrabold text-[#101f3f]">{value}</p>
    </div>
  );
}

function PromoCard({ copy, price, title }: { copy: string; price: string; title: string }) {
  const imageMap: Record<string, string> = {
    "Breakfast bundle": "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&q=80&w=800",
    "Chef's dinner set": "https://images.unsplash.com/photo-1544025162-831e51b14732?auto=format&fit=crop&q=80&w=800"
  };

  const imageUrl = imageMap[title];

  return (
    <Card className="group overflow-hidden rounded-[2rem] border border-[#101f3f]/5 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)]">
      <div className="relative h-44 w-full overflow-hidden bg-[#f4f7fd]">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#101f3f]/20">
            <ShoppingBag aria-hidden size={40} />
          </div>
        )}
        <div className="absolute bottom-4 right-4 rounded-xl bg-white/90 backdrop-blur-md px-4 py-2 shadow-lg">
          <p className="font-extrabold text-[#f97316]">{price}</p>
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-extrabold tracking-tight text-[#101f3f]">{title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-[#101f3f]/60">{copy}</p>
      </div>
    </Card>
  );
}