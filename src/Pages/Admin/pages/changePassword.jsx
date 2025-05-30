import React from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import ChangePassword from  "../components/changePass";

function Prakhar() {
    return (
        <div className="flex flex-col">
            <Navbar/>
            <div className ="flex min-h-screen  w-full"  >
                <Sidebar/>
                <div className="flex flex-col  w-full" >
                    <ChangePassword/>
                </div>
            
            </div>
        </div>
    
)
  }
  
  export default Prakhar;