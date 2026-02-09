import { Router } from '../core/router.js';
import * as I18n from '../services/i18nService.js';

export async function render(container) {
    container.innerHTML = `
        <div class="screen-header">
            <h2>Configuración del Sistema</h2>
        </div>
        
        <p style="color:#64748b; margin-bottom:20px;">
            Administración centralizada de parámetros, accesos y estructura empresarial.
        </p>

        <!-- GRID DE 4 OPCIONES -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;">
            
            <!-- 1. ORGANIZACIONES (Ya funciona) -->
            <div class="card config-card" id="btnGoOrgs">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div class="icon-circle" style="background:#dbeafe; color:#1e40af;">
                        <span class="material-symbols-outlined">domain</span>
                    </div>
                    <div>
                        <h3 class="card-title">Organizaciones</h3>
                        <div class="card-desc">Empresas, Clientes y Jerarquías.</div>
                    </div>
                </div>
            </div>

            <!-- 2. USUARIOS (Ya funciona) -->
            <div class="card config-card" id="btnGoUsers">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div class="icon-circle" style="background:#dcfce7; color:#166534;">
                        <span class="material-symbols-outlined">group</span>
                    </div>
                    <div>
                        <h3 class="card-title">Usuarios y Accesos</h3>
                        <div class="card-desc">Altas, bajas y perfiles de usuario.</div>
                    </div>
                </div>
            </div>

            <!-- 3. MATRIZ DE SEGURIDAD (Pendiente) -->
            <div class="card config-card" id="btnGoSecurity">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div class="icon-circle" style="background:#fee2e2; color:#b91c1c;">
                        <span class="material-symbols-outlined">verified_user</span>
                    </div>
                    <div>
                        <h3 class="card-title">Matriz de Seguridad</h3>
                        <div class="card-desc">Roles, Menús y Niveles (1-3).</div>
                    </div>
                </div>
            </div>

            <!-- 4. CATÁLOGOS (Pendiente) -->
            <div class="card config-card" id="btnGoCatalogs">
                <div style="display:flex; align-items:center; gap:15px;">
                    <div class="icon-circle" style="background:#f1f5f9; color:#64748b;">
                        <span class="material-symbols-outlined">category</span>
                    </div>
                    <div>
                        <h3 class="card-title">Catálogos del Sistema</h3>
                        <div class="card-desc">Listas desplegables y parámetros.</div>
                    </div>
                </div>
            </div>

        </div>

        <style>
            .config-card { 
                cursor: pointer; 
                transition: all 0.2s; 
                border: 1px solid #e2e8f0; 
                padding: 20px;
            }
            .config-card:hover { 
                transform: translateY(-3px); 
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
                border-color: #cbd5e1; 
            }
            .icon-circle {
                padding: 12px; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
            }
            .card-title { margin: 0; font-size: 1rem; color: #1e293b; }
            .card-desc { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
        </style>
    `;

    I18n.traducirPagina(container);

    // --- EVENTOS DE NAVEGACIÓN ---
    
    // 1. Organizaciones -> Abre orgList.js
    document.getElementById('btnGoOrgs').onclick = () => Router.navigate('PAN_ORG_LIST');

    // 2. Usuarios -> Abre userList.js
    document.getElementById('btnGoUsers').onclick = () => Router.navigate('PAN_USER_LIST');

    // 3. Seguridad -> (Placeholder por ahora, iremos a securityMatrix.js luego)
    // 3. Seguridad -> Abre securityMatrix.js
    document.getElementById('btnGoSecurity').onclick = () => {
        Router.navigate('PAN_SEG_MATRIX'); // AHORA SÍ NAVEGA
    };

    // 4. Catálogos -> Abre catalogs.js
    document.getElementById('btnGoCatalogs').onclick = () => {
        Router.navigate('PAN_CATALOGOS');
    };
}