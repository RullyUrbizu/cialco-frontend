import { useState, useEffect } from "react";
import { api } from "../api/api";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";

export const ClienteForm = () => {
    const [razonSocial, setRazonSocial] = useState("");
    const [cuit, setCuit] = useState("");
    const [mensaje, setMensaje] = useState("");
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEditing = Boolean(id);

    useEffect(() => {
        if (isEditing && id) {
            setInitialLoading(true);
            api.get(`/clientes/${id}`)
                .then((res) => {
                    setRazonSocial(res.data.razonSocial);
                    setCuit(res.data.cuit || "");
                })
                .catch((err) => {
                    console.error(err);
                    setMensaje("Error al cargar el cliente ❌");
                })
                .finally(() => setInitialLoading(false));
        }
    }, [id, isEditing]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMensaje("");

        // Enviamos solo los datos editables. Si el backend es estricto, enviar 'id' extra puede causar 400.
        const data = { razonSocial, cuit };

        try {
            let res;
            if (isEditing) {
                res = await api.put(`/clientes/${id}`, data);
            } else {
                res = await api.post("/clientes", data);
            }

            if (res.status === 201 || res.status === 200) {
                setMensaje(isEditing ? "Cliente actualizado correctamente ✅" : "Cliente creado correctamente ✅");
                if (!isEditing) {
                    setRazonSocial("");
                    setCuit("");
                }
                setTimeout(() => navigate("/Clientes"), 1500);
            } else {
                setMensaje("Error al guardar el cliente ❌");
            }
        } catch (err: any) {
            console.error(err);
            if (err.response) {
                if (err.response.status === 409) {
                    setMensaje("Error: Ya existe un cliente con esa Razón Social o CUIT ⚠️");
                } else if (err.response.status === 400) {
                    // Mostramos el mensaje específico del backend para 400 Bad Request
                    setMensaje(`Error en los datos: ${err.response.data.message || JSON.stringify(err.response.data)} ❌`);
                } else {
                    setMensaje(`Error del servidor (${err.response.status}): ${err.response.data.message || ""}`);
                }
            } else {
                setMensaje("Error de conexión: " + (err.message || ""));
            }
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) return <div className="p-8 text-center text-gray-500">Cargando datos del cliente...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate("/Clientes")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                </Button>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
                </h1>
            </div>

            <Card className="p-6">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Razón Social
                        </label>
                        <input
                            type="text"
                            value={razonSocial}
                            onChange={(e) => setRazonSocial(e.target.value)}
                            required
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: Estancia La Paz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            CUIT
                        </label>
                        <input
                            type="text"
                            value={cuit}
                            onChange={(e) => setCuit(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="Ej: 30-12345678-9"
                        />
                    </div>

                    <div className="flex justify-end gap-4 mt-2">
                        <Button type="button" variant="secondary" onClick={() => navigate("/Clientes")}>
                            Cancelar
                        </Button>
                        <Button type="submit" isLoading={loading}>
                            {isEditing ? "Guardar Cambios" : "Crear Cliente"}
                        </Button>
                    </div>
                </form>
                {mensaje && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${mensaje.includes("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {mensaje}
                    </div>
                )}
            </Card>
        </div>
    );
};
