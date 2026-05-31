import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import type {
  User,
  InsertUser,
  InsertProject,
  InsertProjectShare,
  InsertMaterialPrice,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

function getInsertId(result: unknown): number | undefined {
  if (!result || typeof result !== "object") return undefined;

  if ("insertId" in result && typeof result.insertId === "number") {
    return result.insertId;
  }

  if (Array.isArray(result)) {
    for (const item of result) {
      const insertId = getInsertId(item);
      if (insertId !== undefined) return insertId;
    }
  }

  return undefined;
}

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const { drizzle } = await import("drizzle-orm/mysql2");
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── In-memory fallback (no MySQL required) ──────────────────────────────────

interface MemUser extends User {
  id: number;
}
interface MemProject {
  id: number;
  userId: number;
  photoUrl: string;
  photoKey: string;
  squareFeet: number | null;
  depthInches: number | null;
  cornerPoints: string | null;
  selectedMaterial: string | null;
  quantityNeeded: string | null;
  pricePerUnit: string | null;
  materialCost: string | null;
  contractorPricePerSquareFoot: string | null;
  laborCost: string | null;
  totalCost: string | null;
  additionalCostsJson: string | null;
  finalInvoiceTotal: string | null;
  acceptedAt: Date | null;
  zipCode: string | null;
  latitude: string | null;
  longitude: string | null;
  previewImageUrl: string | null;
  previewImageKey: string | null;
  contractorEmail: string | null;
  projectName: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
interface MemProjectShare {
  id: number;
  projectId: number;
  shareToken: string;
  contractorEmail: string | null;
  createdAt: Date;
  expiresAt: Date | null;
  viewCount: number | null;
}
interface MemMaterialPrice {
  id: number;
  zipCode: string;
  material: string;
  pricePerTon: string;
  pricePerSquareFoot: string;
  supplier: string | null;
  lastUpdated: Date;
  expiresAt: Date | null;
}

class MemDb {
  private users: MemUser[] = [];
  private projects: MemProject[] = [];
  private projectShares: MemProjectShare[] = [];
  private materialPrices: MemMaterialPrice[] = [];
  private userIdCounter = 0;
  private projectIdCounter = 0;
  private shareIdCounter = 0;
  private priceIdCounter = 0;

  private clone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  upsertUser(user: InsertUser): MemUser {
    const existing = this.users.find(u => u.openId === user.openId);
    const now = new Date();
    if (existing) {
      if (user.name !== undefined) existing.name = user.name ?? null;
      if (user.email !== undefined) existing.email = user.email ?? null;
      if (user.lastSignedIn !== undefined) existing.lastSignedIn = user.lastSignedIn;
      if (user.role !== undefined) existing.role = user.role;
      existing.updatedAt = now;
      return this.clone(existing);
    }
    const newUser: MemUser = {
      id: ++this.userIdCounter,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"),
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    this.users.push(newUser);
    return this.clone(newUser);
  }

  getUserByOpenId(openId: string): MemUser | undefined {
    const u = this.users.find(u => u.openId === openId);
    return u ? this.clone(u) : undefined;
  }

  getUserById(userId: number): MemUser | undefined {
    const u = this.users.find(u => u.id === userId);
    return u ? this.clone(u) : undefined;
  }

  createUser(user: InsertUser): MemUser {
    const now = new Date();
    const newUser: MemUser = {
      id: ++this.userIdCounter,
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      role: user.role ?? "user",
      createdAt: now,
      updatedAt: now,
      lastSignedIn: user.lastSignedIn ?? now,
    };
    this.users.push(newUser);
    return this.clone(newUser);
  }

  getUserProjects(userId: number): MemProject[] {
    return this.clone(
      this.projects
        .filter(p => p.userId === userId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    );
  }

  getProjectById(projectId: number): MemProject | undefined {
    const p = this.projects.find(p => p.id === projectId);
    return p ? this.clone(p) : undefined;
  }

  createProject(project: InsertProject): { id: number } {
    const now = new Date();
    const newProject: MemProject = {
      id: ++this.projectIdCounter,
      userId: project.userId!,
      photoUrl: project.photoUrl!,
      photoKey: project.photoKey!,
      squareFeet: project.squareFeet ?? null,
      depthInches: project.depthInches ?? null,
      cornerPoints: project.cornerPoints ?? null,
      selectedMaterial: project.selectedMaterial ?? null,
      quantityNeeded: project.quantityNeeded ?? null,
      pricePerUnit: project.pricePerUnit ?? null,
      materialCost: project.materialCost ?? null,
      contractorPricePerSquareFoot: project.contractorPricePerSquareFoot ?? null,
      laborCost: project.laborCost ?? null,
      totalCost: project.totalCost ?? null,
      additionalCostsJson: project.additionalCostsJson ?? null,
      finalInvoiceTotal: project.finalInvoiceTotal ?? null,
      acceptedAt: project.acceptedAt ?? null,
      zipCode: project.zipCode ?? null,
      latitude: project.latitude ?? null,
      longitude: project.longitude ?? null,
      previewImageUrl: project.previewImageUrl ?? null,
      previewImageKey: project.previewImageKey ?? null,
      contractorEmail: project.contractorEmail ?? null,
      projectName: project.projectName ?? null,
      notes: project.notes ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.projects.push(newProject);
    return { id: newProject.id };
  }

  updateProject(projectId: number, updates: Record<string, unknown>): void {
    const p = this.projects.find(p => p.id === projectId);
    if (!p) return;
    const record = p as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(updates)) {
      if (key in p && value !== undefined) {
        record[key] = value === null ? null : value;
      }
    }
    p.updatedAt = new Date();
  }

  deleteProject(projectId: number): void {
    const idx = this.projects.findIndex(p => p.id === projectId);
    if (idx !== -1) this.projects.splice(idx, 1);
  }

  createProjectShare(share: InsertProjectShare): void {
    const newShare: MemProjectShare = {
      id: ++this.shareIdCounter,
      projectId: share.projectId!,
      shareToken: share.shareToken!,
      contractorEmail: share.contractorEmail ?? null,
      createdAt: new Date(),
      expiresAt: share.expiresAt ?? null,
      viewCount: share.viewCount ?? 0,
    };
    this.projectShares.push(newShare);
  }

  getProjectShareByToken(token: string): MemProjectShare | undefined {
    const s = this.projectShares.find(s => s.shareToken === token);
    return s ? this.clone(s) : undefined;
  }

  getMaterialPrices(zipCode: string, material: string): MemMaterialPrice | undefined {
    const p = this.materialPrices.find(
      p => p.zipCode === zipCode && p.material === material
    );
    return p ? this.clone(p) : undefined;
  }

  upsertMaterialPrice(price: InsertMaterialPrice): void {
    const existing = this.materialPrices.find(
      p => p.zipCode === price.zipCode && p.material === price.material
    );
    const now = new Date();
    if (existing) {
      existing.pricePerTon = price.pricePerTon!;
      existing.pricePerSquareFoot = price.pricePerSquareFoot!;
      existing.supplier = price.supplier ?? null;
      existing.lastUpdated = now;
      return;
    }
    this.materialPrices.push({
      id: ++this.priceIdCounter,
      zipCode: price.zipCode!,
      material: price.material!,
      pricePerTon: price.pricePerTon!,
      pricePerSquareFoot: price.pricePerSquareFoot!,
      supplier: price.supplier ?? null,
      lastUpdated: now,
      expiresAt: price.expiresAt ?? null,
    });
  }
}

let _memDb: MemDb | null = null;

function getMemDb(): MemDb {
  if (!_memDb) _memDb = new MemDb();
  return _memDb;
}

// ─── Exported functions (auto-fallback to in-memory) ─────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (db) {
    try {
      const { users } = await import("../drizzle/schema");
      const values: InsertUser = { openId: user.openId };
      const updateSet: Record<string, unknown> = {};

      const textFields = ["name", "email"] as const;
      type TextField = (typeof textFields)[number];
      const assignNullable = (field: TextField) => {
        const value = user[field];
        if (value === undefined) return;
        const normalized = value ?? null;
        values[field] = normalized;
        updateSet[field] = normalized;
      };
      textFields.forEach(assignNullable);

      if (user.lastSignedIn !== undefined) {
        values.lastSignedIn = user.lastSignedIn;
        updateSet.lastSignedIn = user.lastSignedIn;
      }
      if (user.role !== undefined) {
        values.role = user.role;
        updateSet.role = user.role;
      } else if (user.openId === ENV.ownerOpenId) {
        values.role = "admin";
        updateSet.role = "admin";
      }
      if (!values.lastSignedIn) {
        values.lastSignedIn = new Date();
      }
      if (Object.keys(updateSet).length === 0) {
        updateSet.lastSignedIn = new Date();
      }
      await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
      return;
    } catch (error) {
      console.error("[Database] Failed to upsert user:", error);
      throw error;
    }
  }

  getMemDb().upsertUser(user);
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (db) {
    const { users } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  return getMemDb().getUserByOpenId(openId);
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (db) {
    const { users } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  return getMemDb().getUserById(userId);
}

export async function createUser(user: InsertUser): Promise<User> {
  const db = await getDb();
  if (db) {
    const { users } = await import("../drizzle/schema");
    const result = await db.insert(users).values(user);
    const userId = getInsertId(result);
    if (userId === undefined) {
      throw new Error("Database did not return a user id");
    }
    const createdUser = await getUserById(userId);
    if (!createdUser) {
      throw new Error("Failed to load created user");
    }
    return createdUser;
  }

  return getMemDb().createUser(user);
}

export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (db) {
    const { projects } = await import("../drizzle/schema");
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(projects.createdAt);
  }

  return getMemDb().getUserProjects(userId);
}

export async function getProjectById(projectId: number) {
  const db = await getDb();
  if (db) {
    const { projects } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  return getMemDb().getProjectById(projectId);
}

export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (db) {
    const { projects } = await import("../drizzle/schema");
    const result = await db.insert(projects).values(project);
    return { id: getInsertId(result) };
  }

  return getMemDb().createProject(project);
}

export async function updateProject(
  projectId: number,
  updates: Partial<InsertProject>
) {
  const db = await getDb();
  if (db) {
    const { projects } = await import("../drizzle/schema");
    return db.update(projects).set(updates).where(eq(projects.id, projectId));
  }

  getMemDb().updateProject(projectId, updates as Record<string, unknown>);
}

export async function deleteProject(projectId: number) {
  const db = await getDb();
  if (db) {
    const { projects } = await import("../drizzle/schema");
    return db.delete(projects).where(eq(projects.id, projectId));
  }

  getMemDb().deleteProject(projectId);
}

export async function createProjectShare(share: InsertProjectShare) {
  const db = await getDb();
  if (db) {
    const { projectShares } = await import("../drizzle/schema");
    return db.insert(projectShares).values(share);
  }

  getMemDb().createProjectShare(share);
}

export async function getProjectShareByToken(token: string) {
  const db = await getDb();
  if (db) {
    const { projectShares } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(projectShares)
      .where(eq(projectShares.shareToken, token))
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  return getMemDb().getProjectShareByToken(token);
}

export async function getMaterialPrices(zipCode: string, material: string) {
  const db = await getDb();
  if (db) {
    const { materialPrices } = await import("../drizzle/schema");
    const result = await db
      .select()
      .from(materialPrices)
      .where(
        and(
          eq(materialPrices.zipCode, zipCode),
          eq(materialPrices.material, material)
        )
      )
      .limit(1);
    return result.length > 0 ? result[0] : undefined;
  }

  return getMemDb().getMaterialPrices(zipCode, material);
}

export async function upsertMaterialPrice(price: InsertMaterialPrice) {
  const db = await getDb();
  if (db) {
    const { materialPrices } = await import("../drizzle/schema");
    return db
      .insert(materialPrices)
      .values(price)
      .onDuplicateKeyUpdate({
        set: {
          pricePerTon: price.pricePerTon,
          pricePerSquareFoot: price.pricePerSquareFoot,
          supplier: price.supplier,
          lastUpdated: new Date(),
        },
      });
  }

  getMemDb().upsertMaterialPrice(price);
}

// TODO: add feature queries here as your schema grows.
