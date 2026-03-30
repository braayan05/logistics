import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, FileText, CheckCircle, AlertTriangle, Download, CreditCard, Building, Smartphone, Loader2 } from 'lucide-react';
import api from '../services/api';

const FacturaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [factura, setFactura] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [paymentMethod, setPaymentMethod] = useState('TARJETA');
  const [isPaying, setIsPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const isAdminOrOp = ['ADMIN', 'OPERADOR'].includes(user?.rol);

  const fetchFactura = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/facturas/${id}`);
      setFactura(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar los detalles de la factura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFactura();
  }, [id]);

  const handlePayment = async () => {
    if (!window.confirm(`¿Confirmas el pago por orden de ${formatearMoneda(factura.total)} con ${paymentMethod}?`)) return;
    
    setIsPaying(true);
    try {
      await api.post('/pagos/procesar', {
        facturaId: factura.id,
        metodoPago: paymentMethod,
        monto: factura.total
      });
      setPaymentSuccess(true);
      fetchFactura(); // Refrescar para ver estado PAGADA y los pagos devueltos
    } catch (err) {
      alert(err.response?.data?.error || 'Error procesando el pago.');
    } finally {
      setIsPaying(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><div className="spinner"></div></div>;
  if (error) return <div className="text-center p-12 text-error"><h2>{error}</h2><button className="btn btn-secondary mt-4" onClick={() => navigate(-1)}>Volver</button></div>;
  if (!factura) return <div className="text-center p-12">Factura no encontrada</div>;

  const formatearMoneda = (valor) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(valor);
  const formatearFecha = (fecha) => new Intl.DateTimeFormat('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(fecha));

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn btn-ghost p-2 rounded-full border border-color hover:bg-surface-hover">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Factura {factura.numero}
              <span className={`badge ${factura.estado === 'PAGADA' ? 'status-ACEPTADA' : factura.estado === 'VENCIDA' ? 'status-RECHAZADA' : 'status-PENDIENTE'} text-sm`}>
                {factura.estado}
              </span>
            </h1>
          </div>
          <button className="btn btn-secondary flex items-center gap-2" onClick={() => window.print()}>
            <Download size={18} /> Descargar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documento Principal */}
        <div className="lg:col-span-2">
          <div className="card shadow-md border border-color" style={{ backgroundColor: '#ffffff', color: '#1a1a1a' }}>
            {/* Header Factura */}
            <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-black text-blue-900 tracking-tight">LOGISTICS <span className="text-yellow-500">WORLD</span></h2>
                <p className="text-xs text-gray-500 mt-1">NIT. 900.123.456-7</p>
                <p className="text-xs text-gray-500">Calle 100 # 15-20, Bogotá D.C.</p>
                <p className="text-xs text-gray-500">info@logisticsworld.com | +57 300 123 4567</p>
              </div>
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-800 uppercase tracking-widest">Factura de Venta</h3>
                <p className="text-sm font-medium text-gray-600 mt-2">N° {factura.numero}</p>
                <p className="text-sm text-gray-500">Fecha: {formatearFecha(factura.creadoEn)}</p>
              </div>
            </div>

            {/* Datos Cliente */}
            <div className="mb-8">
              <h4 className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-1 mb-3">Facturar a:</h4>
              <p className="font-semibold text-gray-800">{factura.usuario.empresa || `${factura.usuario.nombre} ${factura.usuario.apellido}`}</p>
              <p className="text-sm text-gray-600">{factura.usuario.tipoDocumento}: {factura.usuario.documento}</p>
              <p className="text-sm text-gray-600">{factura.usuario.email}</p>
              <p className="text-sm text-gray-600">{factura.usuario.telefono || 'Sin teléfono registrado'}</p>
            </div>

            {/* Detalles Cobro */}
            <table className="w-full mb-8 text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
                  <th className="py-2 px-3 font-semibold rounded-tl-md rounded-bl-md">Descripción del Servicio</th>
                  <th className="py-2 px-3 font-semibold">Ref. Servicio</th>
                  <th className="py-2 px-3 font-semibold text-right rounded-tr-md rounded-br-md">Importe</th>
                </tr>
              </thead>
              <tbody className="text-gray-800 text-sm">
                <tr className="border-b border-gray-100">
                  <td className="py-4 px-3">
                    <p className="font-semibold">Servicio Logístico Subcontratado</p>
                    <p className="text-xs text-gray-500 mt-1">Sujeto a términos y condiciones de Logistics World.</p>
                  </td>
                  <td className="py-4 px-3">{factura.servicio.numero}</td>
                  <td className="py-4 px-3 text-right font-medium">{formatearMoneda(factura.montoBase)}</td>
                </tr>
              </tbody>
            </table>

            {/* Totales */}
            <div className="flex justify-end">
              <div className="w-1/2">
                <div className="flex justify-between py-2 text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-800">{formatearMoneda(factura.montoBase)}</span>
                </div>
                <div className="flex justify-between py-2 text-sm text-gray-600 border-b border-gray-200">
                  <span>Impuestos (IVA 19%)</span>
                  <span className="font-medium text-gray-800">{formatearMoneda(factura.impuestos)}</span>
                </div>
                <div className="flex justify-between py-3 text-lg font-bold text-blue-900 border-b-2 border-blue-900">
                  <span>TOTAL A PAGAR</span>
                  <span>{formatearMoneda(factura.total)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center text-xs text-gray-500 pt-4 border-t border-gray-200">
              <p>Esta factura de venta se asimila en todos sus efectos a una letra de cambio (Art. 774 C.C).</p>
              <p>Favor realizar el pago antes de su vencimiento para evitar cargos moratorios.</p>
            </div>
          </div>
        </div>

        {/* Panel de Pagos Restringido a Rol */}
        <div className="flex flex-col gap-6">
          {!isAdminOrOp && factura.estado === 'PENDIENTE' && (
            <div className="card shadow-lg border-2" style={{ borderColor: 'var(--color-accent)' }}>
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-accent">
                <CreditCard size={20} /> Pasarela de Pagos
              </h3>
              <p className="text-sm text-secondary mb-6">Selecciona el método de pago para saldar esta factura.</p>
              
              <div className="space-y-3 mb-6">
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'TARJETA' ? 'border-accent bg-surface-hover' : 'border-color hover:bg-surface-hover'}`}>
                  <input type="radio" className="accent-accent" name="payment" value="TARJETA" checked={paymentMethod === 'TARJETA'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <CreditCard className={paymentMethod === 'TARJETA' ? 'text-accent' : 'text-secondary'} size={20}/>
                  <span className="font-medium">Tarjeta de Crédito / Débito</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'PSE' ? 'border-accent bg-surface-hover' : 'border-color hover:bg-surface-hover'}`}>
                  <input type="radio" className="accent-accent" name="payment" value="PSE" checked={paymentMethod === 'PSE'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <Smartphone className={paymentMethod === 'PSE' ? 'text-accent' : 'text-secondary'} size={20}/>
                  <span className="font-medium">Pagos en Línea (PSE)</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${paymentMethod === 'TRANSFERENCIA' ? 'border-accent bg-surface-hover' : 'border-color hover:bg-surface-hover'}`}>
                  <input type="radio" className="accent-accent" name="payment" value="TRANSFERENCIA" checked={paymentMethod === 'TRANSFERENCIA'} onChange={(e) => setPaymentMethod(e.target.value)} />
                  <Building className={paymentMethod === 'TRANSFERENCIA' ? 'text-accent' : 'text-secondary'} size={20}/>
                  <span className="font-medium">Transferencia Bancaria</span>
                </label>
              </div>

              {paymentSuccess && (
                <div className="p-3 mb-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-500 text-sm flex items-start gap-2">
                  <CheckCircle size={18} className="shrink-0 mt-0.5" />
                  <p>¡El pago se ha procesado con éxito y la factura ha sido sellada!</p>
                </div>
              )}

              <button 
                onClick={handlePayment} 
                disabled={isPaying || paymentSuccess}
                className="btn btn-primary w-full justify-center py-3 text-lg font-bold shadow-md shadow-accent/20"
              >
                {isPaying ? <Loader2 className="animate-spin" size={24} /> : `Pagar ${formatearMoneda(factura.total)}`}
              </button>
            </div>
          )}

          {factura.pagos && factura.pagos.length > 0 && (
            <div className="card bg-surface-hover">
              <h3 className="font-semibold mb-4 text-green-400 flex items-center gap-2">
                <CheckCircle size={18} /> Resumen de Pagos
              </h3>
              <div className="space-y-4">
                {factura.pagos.map((pago) => (
                  <div key={pago.id} className="border-b border-color pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium uppercase tracking-wide text-primary">{pago.metodoPago}</span>
                      <span className="font-bold text-accent">{formatearMoneda(pago.monto)}</span>
                    </div>
                    <div className="text-xs text-secondary flex justify-between">
                      <span>Ref: {pago.referencia}</span>
                      <span>{formatearFecha(pago.creadoEn)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAdminOrOp && factura.estado === 'PENDIENTE' && (
            <div className="card text-center p-6 border-dashed border-2 border-secondary bg-surface-hover">
              <AlertTriangle className="mx-auto text-secondary mb-3" size={32} />
              <p className="text-secondary text-sm">Esperando que el cliente realice el pago desde su cuenta para cerrar este ciclo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacturaDetalle;
