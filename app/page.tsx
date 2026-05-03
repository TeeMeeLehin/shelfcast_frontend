import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Pricing from "./components/Pricing";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function HomePage() {
  return (
    <div style={{ background: "#fff" }}>
      <Navbar />
      <section id="home"><Hero /></section>
      <section id="about"><Features /></section>
      <HowItWorks />
      <section id="pricing"><Pricing /></section>
      <section id="contact"><CTASection /></section>
      <Footer />
    </div>
  );
}
