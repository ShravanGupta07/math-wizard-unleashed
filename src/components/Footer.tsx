
import { Link } from "react-router-dom";
import { Calculator, Github, Twitter } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-bold tracking-tight">MathWizard</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              AI-powered mathematics shahahahahahaha.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/app/solver" className="text-muted-foreground hover:text-foreground transition-colors">
                    Solver
                  </Link>
                </li>
                <li>
                  <Link to="/app/examples" className="text-muted-foreground hover:text-foreground transition-colors">
                    Examples
                  </Link>
                </li>
                <li>
                  <Link to="/app/about" className="text-muted-foreground hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} MathWizard. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground mt-2 md:mt-0">
              Powered by GROQ AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
