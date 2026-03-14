import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
    {
        id: 1,
        label: 'MENUITEMS.MENU.TEXT',
        isTitle: true
    },
    {
        id: 7,
        label: 'Principal',
        icon: 'uil-home-alt',
        subItems: [
            { id: 8, label: 'Tablero', link: '/dashboard' },
            { id: 10, label: 'Perfil', link: '/contacts/profile' }
        ]
    },
    {
        id: 27,
        label: 'Administración',
        icon: 'uil-users-alt',
        subItems: [
            { id: 31, label: 'Modulos', link: '/modulos' },
            { id: 29, label: 'Permisos', link: '/permisos' },
            { id: 30, label: 'Roles', link: '/roles' },
            { id: 28, label: 'Usuarios', link: '/usuarios' },
            { id: 32, label: 'Bitacora', link: '/bitacora' }
        ]
    },
    { id: 57, label: 'POS', icon: 'uil-shopping-bag', link: '/recarga' },
    // --- AGRUPADO: Clientes / Cadenas / Salas / Maquinas
    {
        id: 2,
        label: 'Estructura',
        icon: 'uil-layer-group',
        subItems: [
            { id: 3, label: 'Clientes', link: '/clientes' },
            { id: 5, label: 'Salas', link: '/salas' },
            { id: 4, label: 'Zonas', link: '/zonas' },
            { id: 6, label: 'Maquinas', link: '/maquinas' },
            { id: 37, label: 'Cajas', link: '/cajas' },
            { id: 40, label: 'Afiliados', link: '/afiliados' }, 
        ]
    },    

    // --- NO AGRUPADOS (se quedan solos)
    { id: 36, label: 'Boveda', icon: 'uil-wallet', link: '/tesoreria' },
    { id: 38, label: 'Ap. Turnos', icon: 'uil-clock', link: '/turnos' },
    { id: 11, label: 'Monederos', icon: 'uil-moneybag-alt', link: '/monederos' },
    { id: 41, label: 'Transacciones', icon: 'uil-exchange-alt', link: '/transacciones' },
    {
        id: 50,
        label: 'Promociones',
        icon: 'uil-gift',
        subItems: [
            { id: 51, label: 'Catálogo', link: '/promociones/catalogo' },
            { id: 52, label: 'Por afiliado', link: '/promociones/por-afiliado' },
            { id: 53, label: 'Por monedero', link: '/promociones/por-monedero' },
            { id: 54, label: 'Rollover', link: '/promociones/rollover' },
            { id: 55, label: 'Pendientes de conversión', link: '/promociones/pendientes-conversion' },
            { id: 56, label: 'Reportes', link: '/promociones/reportes' }
        ]
    },
    { id: 27, label: 'Monitoreo', icon: 'uil-map', link: '/monitoreo' },
    // --- AGRUPADO: Saldo no debitado / Premios entregados / Venta Acumulada (Promociones movido a ítem propio)
    {
        id: 13,
        label: 'Indicadores',
        icon: 'uil-chart',
        subItems: [
            { id: 14, label: 'Saldo no debitado', link: '/saldo-no-debitado' },
            { id: 15, label: 'Premios entregados', link: '/premios-entregados' },
            { id: 16, label: 'Venta Acumulada', link: '/venta-acumulada' }
        ]
    },

    // --- Promociones (subitems desglosados)
    
    // --- NO AGRUPADOS
    
    { id: 20, label: 'Tipo Estado', icon: 'uil-toggle-on', link: '/tipo-estado' },
    { id: 21, label: 'Efectivo', icon: 'uil-money-stack', link: '/efectivo' },
    { id: 22, label: 'Lealtad', icon: 'uil-heart', link: '/lealtad' },
    { id: 23, label: 'Tipo de Identificación', icon: 'uil-file-alt', link: '/tipo-identificacion' },
    { id: 24, label: 'Número de Identificación', icon: 'uil-credit-card', link: '/numero-identificacion' },
    { id: 25, label: 'Moneda', icon: 'uil-dollar-sign', link: '/moneda' },
    { id: 26, label: 'Cantidad Recibida', icon: 'uil-invoice', link: '/cantidad-recibida' },

    // --- AGRUPADO: Usuarios / Permisos / Roles / Modulos / Bitacora


    // --- AGRUPADO: Caja / Bobeda
    {
        id: 33,
        label: 'Finanzas',
        icon: 'uil-wallet',
        subItems: [
            { id: 34, label: 'Caja', link: '/caja' },
            { id: 35, label: 'Bobeda', link: '/bobeda' }
        ]
    },
    { id: 18, label: 'Tu cuenta', icon: 'uil-user', link: '/cuenta' },
];
