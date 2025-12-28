import Features from "@/components/features";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import { ModeToggle } from "@/components/ui/mode-toggle";

const Page = () => {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <ModeToggle />
    </>
  );
};

export default Page;
