import { Request, Response, NextFunction } from 'express';
export interface UserPayload {
    id: string;
    email: string;
    role: string;
    ayushId?: string;
    name: string;
}
export declare function signToken(payload: UserPayload): string;
export declare function verifyToken(token: string): UserPayload | null;
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=auth.d.ts.map