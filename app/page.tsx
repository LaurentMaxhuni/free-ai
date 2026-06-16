import { CtaBlock } from "@/components/cta";
import FAQ from "@/components/faq";
import Features from "@/components/features";
import Footer from "@/components/footer";
import Hero from "@/components/hero";
import { HomeContent } from "@/components/home-content";
import Navbar from "@/components/navbar";

const Page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HomeContent />
      <FAQ />
      <CtaBlock />
      <Footer />
    </>
  );
};

export default Page;
