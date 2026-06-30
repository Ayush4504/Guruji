

import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { ChevronDown, FileText, GraduationCap, LayoutDashboard, PenBox, StarsIcon} from 'lucide-react'
import React from 'react'
import { Button } from './ui/button'
import Image from 'next/image'
import Link from 'next/link'
import {checkUser} from 'lib/checkUser'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const Header = async () => {
  await checkUser()
  return (
    <div>
      <header className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-md z-50 supports-backdrop-filter:bg-background/60" >
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href='/'>
            <Image src="/logo.png" alt="Guruji Logo" width={200} height={60} className="h-12 py-1 w-auto object-contain"></Image>
        </Link>
        

        <div className='flex items-center space-x-2 md:space-x-4 '>
          <Show when="signed-in">
            <Link href='/dashboard'>
                <Button variant='outline'>
                    <LayoutDashboard className="h-4 w-4"/>
                    <span className='hidden md:block'>Industry Insights</span>
                </Button>
            </Link>
          
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                    <StarsIcon className='h-4 w-4'/>
                    <span className='hidden md:block'>Growth Tools</span>
                    <ChevronDown className='h-4 w-4'/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                
                <DropdownMenuItem>
                  <Link href={"/resume"} className='flex items-cneter gap-2'>
                    <FileText className='h-4 w-4'/>
                    <span>Growth Tools</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/ai-cover-letter"} className='flex items-cneter gap-2'>
                    <PenBox className='h-4 w-4'/>
                    <span>Cover Letter</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={"/interview"} className='flex items-cneter gap-2'>
                    <GraduationCap className='h-4 w-4'/>
                    <span>Interview Prep</span>
                  </Link>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
          </Show> 

            <Show when="signed-out">
              <SignInButton>
                <Button variant='outline'>Sign In</Button>
              </SignInButton>
              {/* <SignUpButton>
                <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton> */}
            </Show>
            <Show when="signed-in">
              <UserButton 
                appearance={{
                  elements:{
                    avatarBox: "w-10 h-10",
                    userButtonPopoverCard: "shadow-xl",
                    userPreviewMainIdentifier: "font-semibold",
                  }
                }} 
                afterSignOutUrl = "/"
              />
            </Show>
        </div>
        
        
        </nav>
      </header>
    </div>
  )
}

export default Header
