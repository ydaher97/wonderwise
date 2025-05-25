export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} WanderWise. All rights reserved.</p>
        <p className="text-sm mt-1">Craft your dream journey with AI.</p>
      </div>
    </footer>
  );
}
