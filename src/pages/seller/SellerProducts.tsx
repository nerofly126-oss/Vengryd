import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type SellerProduct, useSellerDashboardData } from "@/lib/dashboard-store";

const categories = ["Textiles", "Art", "Jewelry", "Beauty", "Accessories", "Home Decor"];

const statusColor: Record<string, string> = {
  Active: "bg-accent/20 text-accent",
  Draft: "bg-secondary text-muted-foreground",
  "Out of Stock": "bg-destructive/20 text-destructive",
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function SellerProducts() {
  const { products, setProducts, addSellerActivity, paymentSettings } = useSellerDashboardData();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<SellerProduct | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<SellerProduct | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formStock, setFormStock] = useState("");

  const filtered = products.filter((product) => {
    const matchStatus = filterStatus === "all" || product.status.toLowerCase().replace(/ /g, "-") === filterStatus;
    const matchSearch = product.name.toLowerCase().includes(search.toLowerCase());

    return matchStatus && matchSearch;
  });

  const openCreate = () => {
    setEditProduct(null);
    setFormName("");
    setFormPrice("");
    setFormCategory("");
    setFormStock("");
    setShowForm(true);
  };

  const openEdit = (product: SellerProduct) => {
    setEditProduct(product);
    setFormName(product.name);
    setFormPrice(product.price);
    setFormCategory(product.category);
    setFormStock(String(product.stock));
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formName || !formPrice) return;

    if (editProduct) {
      setProducts((previous) =>
        previous.map((product) =>
          product.id === editProduct.id
            ? {
                ...product,
                name: formName,
                price: formPrice,
                category: formCategory,
                sellerName: product.sellerName || paymentSettings.accountName || "Vengryd Crafts Ltd",
                location: product.location || "Lagos",
                stock: Number(formStock),
                status: Number(formStock) === 0 ? "Out of Stock" : "Active",
              }
            : product,
        ),
      );
      addSellerActivity({
        name: formName,
        action: "Product details updated",
        time: "Just now",
      });
    } else {
      const newProduct: SellerProduct = {
        id: String(Date.now()),
        name: formName,
        price: formPrice,
        category: formCategory,
        sellerName: paymentSettings.accountName || "Vengryd Crafts Ltd",
        location: "Lagos",
        stock: Number(formStock) || 0,
        sales: 0,
        views: 0,
        status: Number(formStock) > 0 ? "Active" : "Draft",
      };

      setProducts((previous) => [newProduct, ...previous]);
      addSellerActivity({
        name: formName,
        action: "New product added",
        time: "Just now",
      });
    }

    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const removedProduct = products.find((product) => product.id === id);
    setProducts(products.filter((product) => product.id !== id));
    if (removedProduct) {
      addSellerActivity({
        name: removedProduct.name,
        action: "Product removed",
        time: "Just now",
      });
    }
    setConfirmDelete(null);
  };

  return (
    <div>
      <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My Products</h1>
          <p className="mt-1 text-sm text-muted-foreground font-body">{products.length} products in your store</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {[
          { label: "Total Products", value: products.length, icon: Package },
          { label: "Active", value: products.filter((product) => product.status === "Active").length, icon: Eye },
          { label: "Total Sales", value: products.reduce((sum, product) => sum + product.sales, 0), icon: ShoppingCart },
          { label: "Total Views", value: products.reduce((sum, product) => sum + product.views, 0).toLocaleString(), icon: Eye },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
              <p className="font-display text-xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring font-body"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[160px] border-border bg-secondary">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div
        {...fadeUp}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <AnimatePresence>
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="group rounded-xl border border-border bg-card p-4 transition-colors hover:border-accent/30"
            >
              <div className="relative mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-secondary/60">
                <Package className="h-10 w-10 text-muted-foreground/40" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="absolute right-2 top-2 rounded-lg bg-card/80 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(product)}>
                      <Edit className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setConfirmDelete(product)} className="text-destructive">
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-body">{product.category}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor[product.status]}`}>
                  {product.status}
                </span>
              </div>
              <p className="truncate text-sm font-medium text-foreground">{product.name}</p>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <ShoppingCart className="h-3 w-3" /> {product.sales}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" /> {product.views}
                </span>
                <span>Stock: {product.stock}</span>
              </div>
              <p className="mt-2 text-sm font-semibold text-accent">₦{Number(product.price).toLocaleString()}</p>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground font-body">No products found.</div>
        ) : null}
      </motion.div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription className="font-body">
              {editProduct ? "Update your product details" : "Fill in the details for your new product"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-body">Product Name</Label>
              <Input value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="e.g. Handwoven Kente Cloth" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-body">Price (₦)</Label>
                <Input value={formPrice} onChange={(event) => setFormPrice(event.target.value)} placeholder="0.00" type="number" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-body">Stock</Label>
                <Input value={formStock} onChange={(event) => setFormStock(event.target.value)} placeholder="0" type="number" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-body">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="border-border bg-secondary">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editProduct ? "Save Changes" : "Create Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Delete Product</DialogTitle>
            <DialogDescription className="font-body">
              Permanently delete &quot;{confirmDelete?.name}&quot;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => (confirmDelete ? handleDelete(confirmDelete.id) : null)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
