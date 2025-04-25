import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="glass-gold py-6 mt-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="animate-fadeInUp" style={{ animationDelay: "0ms" }}>
            <h3 className="font-bold text-primary mb-4">RENNSZ</h3>
            <p className="text-gray-300 text-sm">IRL and gaming content creator focused on bringing you the best entertainment and community experiences.</p>
          </div>
          
          <div className="animate-fadeInUp" style={{ animationDelay: "100ms" }}>
            <h4 className="font-bold text-primary mb-4">Streams</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.twitch.tv/rennsz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Main IRL Channel
                </a>
              </li>
              <li>
                <a 
                  href="https://www.twitch.tv/rennszino" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Gaming Channel
                </a>
              </li>
              <li>
                <a href="#streams" className="text-gray-300 hover:text-primary transition-colors">
                  Stream Schedule
                </a>
              </li>
            </ul>
          </div>
          
          <div className="animate-fadeInUp" style={{ animationDelay: "200ms" }}>
            <h4 className="font-bold text-primary mb-4">Community</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://discord.gg/hUTXCaSdKC" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Discord Server
                </a>
              </li>
              <li>
                <a 
                  href="https://x.com/i/communities/1823168507401634218" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  X Community
                </a>
              </li>
              <li>
                <a 
                  href="#announcements" 
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Announcements
                </a>
              </li>
            </ul>
          </div>
          
          <div className="animate-fadeInUp" style={{ animationDelay: "300ms" }}>
            <h4 className="font-bold text-primary mb-4">Connect</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://x.com/rennsz96?s=21" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  X (Twitter)
                </a>
              </li>
              <li>
                <a 
                  href="https://www.instagram.com/rennsz?igsh=MWhjYjg2ZDV4dHc0bw==" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a 
                  href="#socials" 
                  className="text-gray-300 hover:text-primary transition-colors"
                >
                  All Social Links
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-primary/30 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">© {new Date().getFullYear()} RENNSZ. All rights reserved.</p>
          
          <div className="flex items-center animate-fadeIn">
            <p className="text-gray-400 text-sm">Made with <span className="text-red-500">❤️</span> by <span className="text-primary">sf.xen</span> on discord</p>
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0 animate-fadeIn">
            <a 
              href="https://www.twitch.tv/rennsz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#6441A4] transition-colors"
              aria-label="Twitch"
            >
              <i className="fab fa-twitch text-lg"></i>
            </a>
            <a 
              href="https://discord.gg/hUTXCaSdKC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#5865F2] transition-colors"
              aria-label="Discord"
            >
              <i className="fab fa-discord text-lg"></i>
            </a>
            <a 
              href="https://x.com/rennsz96?s=21" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="X (Twitter)"
            >
              <i className="fab fa-x-twitter text-lg"></i>
            </a>
            <a 
              href="https://www.instagram.com/rennsz?igsh=MWhjYjg2ZDV4dHc0bw==" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-500 transition-colors"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram text-lg"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
