import { TrendingUp, Users, ShoppingCart, DollarSign } from 'lucide-react';

interface StatProps {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ReactNode;
}

function StatCard({ label, value, change, positive, icon }: StatProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{label}</span>
        <div className="p-2 bg-blue-50 rounded-lg text-blue-500">{icon}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">€{value}</div>
      <div
        className={`text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}
      >
        {positive ? '↑' : '↓'} {change} from last month
      </div>
    </div>
  );
}

export function DemoStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Revenue"
        value="45,231"
        change="12%"
        positive={true}
        icon={<DollarSign size={20} />}
      />
      <StatCard
        label="Active Users"
        value="2,345"
        change="8%"
        positive={true}
        icon={<Users size={20} />}
      />
      <StatCard
        label="Orders"
        value="1,234"
        change="3%"
        positive={false}
        icon={<ShoppingCart size={20} />}
      />
      <StatCard
        label="Growth"
        value="23.5%"
        change="4%"
        positive={true}
        icon={<TrendingUp size={20} />}
      />
    </div>
  );
}


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJtYXBwaW5ncyI6IkFBQUEsZUFBZTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBIiwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlcyI6WyJEZW1vU3RhdHMudHN4Il0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IFwiaW1wb3J0IHsgVHJlbmRpbmdVcCwgVXNlcnMsIFNob3BwaW5nQ2FydCwgRG9sbGFyU2lnbiB9IGZyb20gJ2x1Y2lkZS1yZWFjdCc7XFxyXFxuXFxyXFxuaW50ZXJmYWNlIFN0YXRQcm9wcyB7XFxyXFxuICBsYWJlbDogc3RyaW5nO1xcclxcbiAgdmFsdWU6IHN0cmluZztcXHJcXG4gIGNoYW5nZTogc3RyaW5nO1xcclxcbiAgcG9zaXRpdmU6IGJvb2xlYW47XFxyXFxuICBpY29uOiBSZWFjdC5SZWFjdE5vZGU7XFxyXFxufVxcclxcblxcclxcbmZ1bmN0aW9uIFN0YXRDYXJkKHsgbGFiZWwsIHZhbHVlLCBjaGFuZ2UsIHBvc2l0aXZlLCBpY29uIH06IFN0YXRQcm9wcykge1xcclxcbiAgcmV0dXJuIChcXHJcXG4gICAgPGRpdiBjbGFzc05hbWU9XFxcImJnLXdoaXRlIHJvdW5kZWQteGwgc2hhZG93LW1kIHAtNVxcXCI+XFxyXFxuICAgICAgPGRpdiBjbGFzc05hbWU9XFxcImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBtYi0zXFxcIj5cXHJcXG4gICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cXFwidGV4dC1ncmF5LTUwMCB0ZXh0LXNtXFxcIj57bGFiZWx9PC9zcGFuPlxcclxcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInAtMiBiZy1ibHVlLTUwIHJvdW5kZWQtbGcgdGV4dC1ibHVlLTUwMFxcXCI+e2ljb259PC9kaXY+XFxyXFxuICAgICAgPC9kaXY+XFxyXFxuICAgICAgPGRpdiBjbGFzc05hbWU9XFxcInRleHQtMnhsIGZvbnQtYm9sZCB0ZXh0LWdyYXktOTAwIG1iLTFcXFwiPnt2YWx1ZX08L2Rpdj5cXHJcXG4gICAgICA8ZGl2XFxyXFxuICAgICAgICBjbGFzc05hbWU9e2B0ZXh0LXNtICR7cG9zaXRpdmUgPyAndGV4dC1ncmVlbi02MDAnIDogJ3RleHQtcmVkLTYwMCd9YH1cXHJcXG4gICAgICA+XFxyXFxuICAgICAgICB7cG9zaXRpdmUgPyAn4oaRJyA6ICfihpMnfSB7Y2hhbmdlfSBmcm9tIGxhc3QgbW9udGhcXHJcXG4gICAgICA8L2Rpdj5cXHJcXG4gICAgPC9kaXY+XFxyXFxuICApO1xcclxcbn1cXHJcXG5cXHJcXG5leHBvcnQgZnVuY3Rpb24gRGVtb1N0YXRzKCkge1xcclxcbiAgcmV0dXJuIChcXHJcXG4gICAgPGRpdiBjbGFzc05hbWU9XFxcImdyaWQgZ3JpZC1jb2xzLTEgbWQ6Z3JpZC1jb2xzLTIgbGc6Z3JpZC1jb2xzLTQgZ2FwLTRcXFwiPlxcclxcbiAgICAgIDxTdGF0Q2FyZFxcclxcbiAgICAgICAgbGFiZWw9XFxcIlRvdGFsIFJldmVudWVcXFwiXFxyXFxuICAgICAgICB2YWx1ZT1cXFwiJDQ1LDIzMVxcXCJcXHJcXG4gICAgICAgIGNoYW5nZT1cXFwiMTIlXFxcIlxcclxcbiAgICAgICAgcG9zaXRpdmU9e3RydWV9XFxyXFxuICAgICAgICBpY29uPXs8RG9sbGFyU2lnbiBzaXplPXsyMH0gLz59XFxyXFxuICAgICAgLz5cXHJcXG4gICAgICA8U3RhdENhcmRcXHJcXG4gICAgICAgIGxhYmVsPVxcXCJBY3RpdmUgVXNlcnNcXFwiXFxyXFxuICAgICAgICB2YWx1ZT1cXFwiMiwzNDVcXFwiXFxyXFxuICAgICAgICBjaGFuZ2U9XFxcIjglXFxcIlxcclxcbiAgICAgICAgcG9zaXRpdmU9e3RydWV9XFxyXFxuICAgICAgICBpY29uPXs8VXNlcnMgc2l6ZT17MjB9IC8+fVxcclxcbiAgICAgIC8+XFxyXFxuICAgICAgPFN0YXRDYXJkXFxyXFxuICAgICAgICBsYWJlbD1cXFwiT3JkZXJzXFxcIlxcclxcbiAgICAgICAgdmFsdWU9XFxcIjEsMjM0XFxcIlxcclxcbiAgICAgICAgY2hhbmdlPVxcXCIzJVxcXCJcXHJcXG4gICAgICAgIHBvc2l0aXZlPXtmYWxzZX1cXHJcXG4gICAgICAgIGljb249ezxTaG9wcGluZ0NhcnQgc2l6ZT17MjB9IC8+fVxcclxcbiAgICAgIC8+XFxyXFxuICAgICAgPFN0YXRDYXJkXFxyXFxuICAgICAgICBsYWJlbD1cXFwiR3Jvd3RoXFxcIlxcclxcbiAgICAgICAgdmFsdWU9XFxcIjIzLjUlXFxcIlxcclxcbiAgICAgICAgY2hhbmdlPVxcXCI0JVxcXCJcXHJcXG4gICAgICAgIHBvc2l0aXZlPXt0cnVlfVxcclxcbiAgICAgICAgaWNvbj17PFRyZW5kaW5nVXAgc2l6ZT17MjB9IC8+fVxcclxcbiAgICAgIC8+XFxyXFxuICAgIDwvZGl2PlxcclxcbiAgKTtcXHJcXG59XFxyXFxuXCIiXSwiZmlsZSI6IkU6L1Byb2dlL0xvcHV0b28vTmF0dXJhbFVJRWRpdG9yL3NyYy9kZW1vL0RlbW9TdGF0cy50c3gifQ==