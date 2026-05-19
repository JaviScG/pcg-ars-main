import { MallaEsfera } from "./malla-sup-par.js"
import { ObjetoAnimado } from "./objeto-anim.js"
import { CMat4, Vec3, UVec3 } from "./vec-mat.js"
import { ObjetoCompuesto } from "./objeto-comp.js"
import { CuadradoXZ, MallaInd } from "./malla-ind.js"

type PuntoPlano = { x: number; z: number }

function v3DesdeXZ(p: PuntoPlano, y: number): Vec3 {
     return new Vec3([p.x, y, p.z])
}

function hermitePos(p0: PuntoPlano, p1: PuntoPlano, t0: PuntoPlano, t1: PuntoPlano, u: number): PuntoPlano {
     const u2 = u * u
     const u3 = u2 * u

     const h00 = 2 * u3 - 3 * u2 + 1
     const h10 = u3 - 2 * u2 + u
     const h01 = -2 * u3 + 3 * u2
     const h11 = u3 - u2

     return {
          x: h00 * p0.x + h10 * t0.x + h01 * p1.x + h11 * t1.x,
          z: h00 * p0.z + h10 * t0.z + h01 * p1.z + h11 * t1.z,
     }
}

function hermiteDer(p0: PuntoPlano, p1: PuntoPlano, t0: PuntoPlano, t1: PuntoPlano, u: number): PuntoPlano {
     const u2 = u * u

     const dh00 = 6 * u2 - 6 * u
     const dh10 = 3 * u2 - 4 * u + 1
     const dh01 = -6 * u2 + 6 * u
     const dh11 = 3 * u2 - 2 * u

     return {
          x: dh00 * p0.x + dh10 * t0.x + dh01 * p1.x + dh11 * t1.x,
          z: dh00 * p0.z + dh10 * t0.z + dh01 * p1.z + dh11 * t1.z,
     }
}

function distXZ(a: PuntoPlano, b: PuntoPlano): number {
     const dx = b.x - a.x
     const dz = b.z - a.z
     return Math.hypot(dx, dz)
}

function tangentesCatmullRom(pts: PuntoPlano[], tension = 0.5): PuntoPlano[] {
     const n = pts.length
     const tans: PuntoPlano[] = new Array(n)
     for (let i = 0; i < n; i++) {
          const prev = pts[Math.max(0, i - 1)]
          const next = pts[Math.min(n - 1, i + 1)]
          tans[i] = { x: tension * (next.x - prev.x), z: tension * (next.z - prev.z) }
     }
     return tans
}

function wrap01(x: number): number {
     return x - Math.floor(x)
}

class MallaPolilineaXZ extends MallaInd {
     constructor(puntos: PuntoPlano[], y: number, ancho: number, color: Vec3) {
          super()
          this.nombre = "Polilínea XZ"

          const hw = ancho * 0.5
          const n = puntos.length

          function normalizar2D(x: number, z: number): { x: number, z: number } {
               const l = Math.hypot(x, z)
               if (l == 0.0)
                    return { x: 0.0, z: 1.0 }
               return { x: x / l, z: z / l }
          }

          for (let i = 0; i < n; i++) {
               const p0 = puntos[Math.max(0, i - 1)]
               const p1 = puntos[Math.min(n - 1, i + 1)]

               const dir = normalizar2D(p1.x - p0.x, p1.z - p0.z)
               const per = { x: -dir.z, z: dir.x }

               const px = puntos[i].x
               const pz = puntos[i].z

               this.posiciones.push(new Vec3([px + per.x * hw, y, pz + per.z * hw]))
               this.posiciones.push(new Vec3([px - per.x * hw, y, pz - per.z * hw]))

               this.colores.push(color)
               this.colores.push(color)
          }

          for (let i = 0; i < n - 1; i++) {
               const a = 2 * i
               const b = 2 * i + 1
               const c = 2 * i + 2
               const d = 2 * i + 3

               this.triangulos.push(new UVec3([a, c, b]))
               this.triangulos.push(new UVec3([b, c, d]))
          }
     }
}

class DiscoXZ extends MallaInd {
     constructor(radio: number, n: number, y: number, color: Vec3) {
          super()
          this.nombre = "Disco XZ"

          this.posiciones.push(new Vec3([0, y, 0]))
          this.colores.push(color)

          for (let i = 0; i < n; i++) {
               const ang = (2.0 * Math.PI * i) / n
               const x = radio * Math.cos(ang)
               const z = radio * Math.sin(ang)
               this.posiciones.push(new Vec3([x, y, z]))
               this.colores.push(color)
          }

          for (let i = 0; i < n; i++) {
               const i1 = 1 + i
               const i2 = 1 + ((i + 1) % n)
               this.triangulos.push(new UVec3([0, i2, i1]))
          }
     }
}

class CocheSimple extends ObjetoCompuesto {
     constructor() {
          super()
          this.nombre = "Coche"

          const cuerpo = new MallaEsfera(16, 16)
          cuerpo.matrizModelado = CMat4.escalado(new Vec3([0.12, 0.06, 0.18]))

          const rueda1 = new MallaEsfera(12, 12)
          rueda1.matrizModelado = CMat4.traslacion(new Vec3([0.10, -0.06, 0.12])).componer(CMat4.escalado(new Vec3([0.04, 0.04, 0.04])))
          const rueda2 = new MallaEsfera(12, 12)
          rueda2.matrizModelado = CMat4.traslacion(new Vec3([-0.10, -0.06, 0.12])).componer(CMat4.escalado(new Vec3([0.04, 0.04, 0.04])))
          const rueda3 = new MallaEsfera(12, 12)
          rueda3.matrizModelado = CMat4.traslacion(new Vec3([0.10, -0.06, -0.12])).componer(CMat4.escalado(new Vec3([0.04, 0.04, 0.04])))
          const rueda4 = new MallaEsfera(12, 12)
          rueda4.matrizModelado = CMat4.traslacion(new Vec3([-0.10, -0.06, -0.12])).componer(CMat4.escalado(new Vec3([0.04, 0.04, 0.04])))

          this.agregar(cuerpo)
          this.agregar(rueda1)
          this.agregar(rueda2)
          this.agregar(rueda3)
          this.agregar(rueda4)
     }
}

export class CocheSplineHermite extends ObjetoAnimado {
     private readonly yBase = 0.0
     private readonly yCoche = 0.10

     private readonly pts: PuntoPlano[]
     private readonly tans: PuntoPlano[]
     private readonly segLen: number[]
     private readonly totalLen: number

     private velocidad: number = 0.7 // unidades por segundo (se afecta por param_S)

     private nodoCoche: ObjetoCompuesto

     constructor() {
          super()
          this.nombre = "Coche en spline Hermite"

          this.pts = [
               { x: -0.9, z: -0.6 },
               { x: -0.4, z: 0.7 },
               { x: 0.3, z: 0.4 },
               { x: 0.8, z: 0.9 },
               { x: 0.9, z: -0.2 },
               { x: 0.0, z: -0.9 },
               { x: -0.2, z: -0.5 },
          ]
          this.tans = tangentesCatmullRom(this.pts)

          const segN = this.pts.length - 1
          this.segLen = new Array(segN)
          this.totalLen = this.aproxLongitudTotal(40)

          const raiz = new ObjetoCompuesto()

          raiz.agregar(new CuadradoXZ())

          const colorPunto = new Vec3([0.9, 0.1, 0.1])
          for (let i = 0; i < this.pts.length; i++) {
               const d = new DiscoXZ(0.05, 24, this.yBase + 0.001, colorPunto)
               d.matrizModelado = CMat4.traslacion(v3DesdeXZ(this.pts[i], 0.0))
               raiz.agregar(d)
          }

          const curva = this.crearCurvaMuestreada(30)
          raiz.agregar(curva)

          this.nodoCoche = new ObjetoCompuesto()
          this.nodoCoche.agregar(new CocheSimple())
          raiz.agregar(this.nodoCoche)

          this.obj_vis = raiz
          this.estadoInicial()
     }

     protected estadoInicial(): void {
          this.colocarCocheEn(0.0)
     }

     protected actualizarObjeto(inc_t_animado: number): void {
          const v = this.velocidad * (1.0 + 2.0 * this.param_S)
          const s = v * this.t_animado
          const uGlobal = wrap01(s / this.totalLen)
          this.colocarCocheEn(uGlobal)
     }

     private aproxLongitudTotal(muestrasPorSeg: number): number {
          let total = 0.0
          for (let i = 0; i < this.pts.length - 1; i++) {
               const len = this.aproxLongitudSegmento(i, muestrasPorSeg)
               this.segLen[i] = len
               total += len
          }
          return total
     }

     private aproxLongitudSegmento(i: number, muestras: number): number {
          let len = 0.0
          let prev = hermitePos(this.pts[i], this.pts[i + 1], this.tans[i], this.tans[i + 1], 0.0)
          for (let k = 1; k <= muestras; k++) {
               const u = k / muestras
               const cur = hermitePos(this.pts[i], this.pts[i + 1], this.tans[i], this.tans[i + 1], u)
               len += distXZ(prev, cur)
               prev = cur
          }
          return len
     }

     private evalPorUGlobal(uGlobal: number): { pos: PuntoPlano; der: PuntoPlano } {
          const segN = this.pts.length - 1
          const u = Math.min(0.999999, Math.max(0.0, uGlobal))
          const scaled = u * segN
          const i = Math.min(segN - 1, Math.floor(scaled))
          const localU = scaled - i

          return {
               pos: hermitePos(this.pts[i], this.pts[i + 1], this.tans[i], this.tans[i + 1], localU),
               der: hermiteDer(this.pts[i], this.pts[i + 1], this.tans[i], this.tans[i + 1], localU),
          }
     }

     private colocarCocheEn(uGlobal: number): void {
          const ev = this.evalPorUGlobal(uGlobal)
          const pos = v3DesdeXZ(ev.pos, this.yCoche)

          const angY = Math.atan2(ev.der.x, ev.der.z)

          const mm = CMat4.traslacion(pos).componer(CMat4.rotacionYgrad(angY * 180.0 / Math.PI))
          this.nodoCoche.matrizModelado = mm
     }

     private crearCurvaMuestreada(muestrasPorSeg: number): MallaInd {
          const puntos: PuntoPlano[] = []
          for (let i = 0; i < this.pts.length - 1; i++) {
               for (let k = 0; k <= muestrasPorSeg; k++) {
                    const u = k / muestrasPorSeg
                    puntos.push(hermitePos(this.pts[i], this.pts[i + 1], this.tans[i], this.tans[i + 1], u))
               }
          }
          return new MallaPolilineaXZ(puntos, this.yBase + 0.002, 0.03, new Vec3([0.1, 0.4, 0.9]))
     }
}
