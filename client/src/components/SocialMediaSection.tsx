
export default function SocialMediaSection() {
  const socials = [
    { icon: "twitch", name: "Twitch", url: "#" },
    { icon: "youtube", name: "YouTube", url: "#" },
    { icon: "twitter", name: "Twitter", url: "#" },
    { icon: "discord", name: "Discord", url: "#" }
  ];

  return (
    <section id="socials" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary">Connect With Us</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {socials.map((social) => (
            <a 
              key={social.name}
              href={social.url}
              className="bg-zinc-900/50 border border-primary/10 rounded-lg p-6 hover:border-primary/20 transition-colors text-center"
            >
              <i className={`fab fa-${social.icon} text-4xl text-primary mb-4`}></i>
              <h3 className="text-xl font-bold text-primary">{social.name}</h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
