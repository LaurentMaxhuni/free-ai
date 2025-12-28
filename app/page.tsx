import Contact from "@/components/contact";
import { CtaBlock } from "@/components/cta";
import FAQ from "@/components/faq";
import Features from "@/components/features";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ModeToggle } from "@/components/ui/mode-toggle";

const Page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <FAQ />
      <CtaBlock />
      {/* <Contact /> */}
      <Footer />
      <ModeToggle />
    </>
  );
};

export default Page;
