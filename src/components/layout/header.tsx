
"use client";

import Link from 'next/link';
import { PlaneTakeoff, LogOut, UserCircle, ExternalLink, LayoutDashboard, Lightbulb } from 'lucide-react'; // Added Lightbulb
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, logOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/');
  };

  const getInitials = (email: string | null | undefined) => {
    if (!email) return 'WW';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary hover:opacity-80 transition-opacity">
          <PlaneTakeoff className="h-8 w-8" />
          <span>WanderWise</span>
        </Link>
        <nav className="flex items-center gap-2 md:gap-4">
          <Link href="/suggest-destinations" className="text-foreground hover:text-primary transition-colors font-medium flex items-center gap-1 text-sm md:text-base">
            <Lightbulb className="h-4 w-4 md:h-5 md:w-5" /> 
            <span className="hidden sm:inline">Suggestions</span>
            <span className="sm:hidden">Ideas</span>
          </Link>
          {loading ? (
            <div className="h-8 w-20 animate-pulse bg-muted rounded-md"></div>
          ) : user ? (
            <>
              <Link href="/plan" className="text-foreground hover:text-primary transition-colors font-medium hidden sm:block">
                Plan a Trip
              </Link>
              <Link href="/dashboard" className="text-foreground hover:text-primary transition-colors font-medium hidden sm:block">
                My Trips
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-9 w-9">
                      {/* <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "User"} /> */}
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.displayName || user.email?.split('@')[0]}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/plan')} className="sm:hidden">
                    <PlaneTakeoff className="mr-2 h-4 w-4" />
                    <span>Plan a Trip</span>
                  </DropdownMenuItem>
                   <DropdownMenuItem onClick={() => router.push('/dashboard')} className="sm:hidden">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>My Trips</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="sm:hidden"/>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login" passHref>
                <Button variant="ghost" className="text-foreground hover:text-primary transition-colors font-medium text-sm md:text-base">
                  Login
                </Button>
              </Link>
              <Link href="/signup" passHref>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm md:text-base">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
