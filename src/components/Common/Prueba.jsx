import { Button } from "@/components/ui/button";
const Prueba = () => {
    return ( 
        <div className="flex flex-col items-center justify-center space-y-4 align-center">
        <h1 className="text-3xl font-bold">Bienvenido a la Ferretería</h1>
        <p className="text-muted-foreground">
          Sistema de gestión de ferretería
        </p>
        <Button>Comenzar</Button>
      </div>
     );
}
 
export default Prueba;