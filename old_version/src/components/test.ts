import { NavBar } from "./NavBar";
import { testBackend } from "../pages/testBackend";


export function test() {
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = /*html*/`

		<header id='navigation-bar'></header>
		<div id="create-user"></div>

        `;
    }
	testBackend('create-user');
	NavBar();

    return root;
}

// export function test() {
//     const root = document.getElementById('root');
//     if (root) {
//         root.innerHTML = /*html*/`
//         <style>
//             dialog::backdrop {
//                 background: rgba(0, 0, 0, 0.5);
//             }
//             dialog {
//                 border: none;
//                 border-radius: 8px;
//                 padding: 2rem;
//                 box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
//             }
//         </style>

// 		<div class='p-20'>
// 			<a class="styled-link" onclick="document.getElementById('modal-1').showModal()">
// 				Open Modal 1
// 			</a>
// 			<button class="btn-primary" onclick="document.getElementById('modal-2').showModal()">
// 				Open Modal 2
// 			</button>

// 			<dialog id="modal-1">
// 				<h2>Modal One</h2>
// 				<p>Content here</p>
// 				<button onclick="this.closest('dialog').close()">Close</button>
// 			</dialog>

// 			<dialog id="modal-2">
// 				<h2>Modal Two</h2>
// 				<p>Content here</p>
// 				<button onclick="this.closest('dialog').close()">Close</button>
// 			</dialog>
// 		</div>

//         `;
//     }
//     return root;
// }
