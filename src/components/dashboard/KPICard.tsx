import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'warning' | 'success';
  className?: string;
  delay?: number;
}
export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className,
  delay = 0
}: KPICardProps) {
  return <motion.div initial={{
    opacity: 0,
    y: 20,
    scale: 0.95
  }} animate={{
    opacity: 1,
    y: 0,
    scale: 1
  }} transition={{
    duration: 0.4,
    delay: delay * 0.05,
    ease: "easeOut"
  }} whileHover={{
    scale: 1.02,
    transition: {
      duration: 0.2
    }
  }} className={cn("relative group overflow-hidden rounded-2xl p-5 transition-all duration-500", "bg-gradient-mesh border border-border/50", variant === 'primary' && "card-glow border-primary/30", variant === 'success' && "border-success/30 hover:border-success/50", variant === 'warning' && "border-warning/30 hover:border-warning/50", variant === 'default' && "hover:border-primary/30", className)}>
      {/* Animated gradient overlay on hover */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none", variant === 'primary' && "bg-gradient-to-br from-primary/10 via-transparent to-accent/5", variant === 'success' && "bg-gradient-to-br from-success/10 via-transparent to-transparent", variant === 'warning' && "bg-gradient-to-br from-warning/10 via-transparent to-transparent", variant === 'default' && "bg-gradient-to-br from-primary/5 via-transparent to-transparent")} />

      {/* Top accent line */}
      {variant === 'primary' && <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />}
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {title}
          </p>
          <p className={cn("text-3xl font-bold tracking-tight font-display", variant === 'primary' && "text-gradient-primary")}>
            {value}
          </p>
          
          {(subtitle || trendValue) && <div className="flex items-center gap-2 mt-3">
              {trendValue && <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", trend === 'up' && "bg-success/15 text-success", trend === 'down' && "bg-destructive/15 text-destructive", trend === 'neutral' && "bg-muted text-muted-foreground")}>
                  {trend === 'up' && '↑'}
                  {trend === 'down' && '↓'}
                  {trendValue}
                </span>}
              {subtitle}
            </div>}
        </div>
        
        {Icon && <motion.div initial={{
        rotate: -10,
        scale: 0.9
      }} animate={{
        rotate: 0,
        scale: 1
      }} transition={{
        delay: delay * 0.05 + 0.2
      }} className={cn("p-3 rounded-xl transition-all duration-300", variant === 'primary' && "bg-primary/15 group-hover:bg-primary/25", variant === 'success' && "bg-success/15 group-hover:bg-success/25", variant === 'warning' && "bg-warning/15 group-hover:bg-warning/25", variant === 'default' && "bg-muted group-hover:bg-muted/80")}>
            <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", variant === 'primary' && "text-primary", variant === 'success' && "text-success", variant === 'warning' && "text-warning", variant === 'default' && "text-muted-foreground")} />
          </motion.div>}
      </div>
    </motion.div>;
}