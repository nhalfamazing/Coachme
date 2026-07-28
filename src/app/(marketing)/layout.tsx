import "./marketing.css";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

// Shared shell for the public marketing pages (/, /about, /privacy,
// /terms, /contact). The product lives at /app and has no marketing
// chrome; /coach and /become-a-coach keep their own layouts.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mk-page body">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
