"use client";
import { useState } from "react";
import Image from "next/image";

{/* Dependencies required for drop down menu */}
import { Menu, MenuItem, MenuButton } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

export default function Dashboard() {
    const [search, setSearch] = useState("");
    
    return (
        <div className="max-h-screen bg-gray-100">
            <h1 className="text-3xl text-black font-bold translate-x-52 translate-y-15"> Welcome Back *username*!</h1>

            {/* Search Bar */}
            <div className="translate-x-52 translate-y-17">
              <div>
                <form>
                    <input
                        id="search"
                        type="text"
                        value={search}
                        onChange={(t) => setSearch(t.target.value)}
                        className="pl-1 pr-1 py-3 min-w-240 bg-gray-200 border-gray-600 rounded-xl text-gray-900 hover:bg-gray-300"
                        placeholder="🔍 Search"
                        required
                    />
                    <button
                        type="submit"
                        className="translate-x-2 min-h-10 min-w-20 py-3 rounded-xl bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 shadow-lg transition"> 
                        Submit
                    </button>
                </form>
              </div>
            </div>

            {/* Create new template button */}
            {/* TODO: Link to table creation page later */}
            <button
                type="button"
                className="translate-x-52 translate-y-20 text-white py-1 px-2 rounded-lg bg-blue-700 font-semibold hover:bg-blue-800 shadow-lg">
                + Create New Template
            </button>

            {/* Navigation Table */}
            {/* TODO: Fix so it reads this data from the sql. Just sample data in there at the moment*/}
            <div className="translate-x-52 translate-y-25">
                <table className="border-collapse border border-gray-300 table-auto">
                    <thead>
                        <tr>
                            <th className="column-padding border text-left"> Template Name </th>
                            <th className="column-padding border text-left"> Assessment </th>
                            <th className="column-padding border text-left"> Subject </th>
                            <th className="column-padding border text-left"> Creator </th>
                            <th className="column-padding border text-left"> Actions </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="column-padding border text-left"> Template 1 </td>
                            <td className="column-padding border text-left"> Assignment 1 </td>
                            <td className="column-padding border text-left"> COMP30022 </td>
                            <td className="column-padding border text-left"> John Smith </td>
                            <td className="column-padding border text-left"> 
                                <button 
                                    type="submit"
                                    className="rounded-xl border border-blue-900 font-semibold px-2 hover:bg-gray-200">
                                    Preview
                                </button>
                                <button
                                    type="submit"
                                    className="translate-x-1 rounded-xl border border-blue-900 font-semibold px-2 hover:bg-gray-200">
                                    Duplicate
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Top Panel */}
            <div className="min-h-13 max-h-13 bg-white p-4 translate-x-50 -translate-y-45">
                <p className="text-gray-500"> Dashboard </p>
                <div className="float-right -translate-x-60 -translate-y-7">
                    <Image
                        src="icons/profile-filler.svg"
                        alt="profile picture"
                        width={30}
                        height={30}
                    />
                    <div className="translate-x-8 -translate-y-6.5">
                        <Menu menuButton={<MenuButton>*username* ▿</MenuButton>} transition>
                            {/* TODO: Link this back to the log in page */}
                            <MenuItem>Log Out</MenuItem>
                        </Menu>
                    </div>
                </div>
            </div>

            {/* Side Menu */}
            <div className="min-h-screen max-w-50 bg-blue-900 -translate-y-57">
                <p className="font-bold text-xl text-white translate-x-6 translate-y-4"> ⚙️ Dashboard </p>
            </div>
        </div>
    );
}