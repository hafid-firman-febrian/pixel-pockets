import { ReactNode } from "react";
import Link from "next/link";

import { logoutAction } from "@/app/actions/auth";

interface NavlinkProps {
  children: ReactNode;
  href: string;
}

function Navlink({ children, href }: NavlinkProps) {
  return (
    <Link href={href}>
      <div className="active:bg-yellow-300 hover:bg-yellow-300 px-2 cursor-pointer transition-colors font-mono">
        {children}
      </div>
    </Link>
  );
}

function Navbar() {
  return (
    <>
      <nav className="grid md:grid-cols-2 grid-cols-1 md:gap-4 gap-1 items-center">
        {/* Logo / Title */}
        <Link href="/home">
          <p className="lg:text-4xl text-2xl md:text-left text-center text-slate-900 font-mono">
            ~${" "}
            <span className="bg-yellow-300 mx-1 lg:text-4xl text-2xl px-2 font-bold">
              Pixel-Pockets
            </span>
          </p>
        </Link>

        {/* Navigation menu */}
        <div className="flex md:ml-auto md:mr-0 m-auto gap-2 items-center">
          <Navlink href="/home">#home</Navlink>
          <Navlink href="/input">/input</Navlink>
          <form action={logoutAction}>
            <button
              type="submit"
              className="active:bg-red-300 hover:bg-red-300 px-2 cursor-pointer transition-colors font-mono"
            >
              /logout
            </button>
          </form>
        </div>
      </nav>

      {/* Divider */}
      <div className="block h-px bg-gray-900 mt-2 mb-5"></div>
    </>
  );
}

export default Navbar;
