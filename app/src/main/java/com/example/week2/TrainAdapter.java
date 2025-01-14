package com.example.week2;

import android.content.Context;
import android.content.Intent;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.res.ResourcesCompat;
import androidx.recyclerview.widget.RecyclerView;

import java.lang.reflect.Array;
import java.util.ArrayList;

public class TrainAdapter extends RecyclerView.Adapter<TrainAdapter.CustomViewHolder> {
    private ArrayList <Skill> mList;
    private Context context;
    private User user;
    private int color;
    private int level;

    static private OnItemClickListener mListener = null;
    public TrainAdapter(Context context, ArrayList<Skill> list, int color, int level) {
        this.context = context;
        this.mList = list;
        this.color = color;
        this.level = level;
    }
    public interface OnItemClickListener {
        void onUpClick(View v, int position);
        void onItemClick(View v, int position, View itemView);
    }
    public void setOnItemCLickListener(OnItemClickListener listener) {mListener = listener; }

    /* CustomViewHolder constructed with textViews */
    public class CustomViewHolder extends RecyclerView.ViewHolder {
        protected TextView name;
        protected TextView level;
        protected Button bt;
        public CustomViewHolder(View view) {
            super(view);
            this.name = view.findViewById(R.id.skill_name);
            this.level = view.findViewById(R.id.skill_level);
            this.bt = view.findViewById(R.id.skillcost);
            view.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View view) {
                    mListener.onItemClick(view, getAdapterPosition(), view);
                }
            });
            bt.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    //스킬 레벨업
                    mListener.onUpClick(view, getAdapterPosition());
                }
            });
        }
    }
    public void setmList(ArrayList<Skill> list){
        this.mList = list;
        notifyDataSetChanged();
    }
    /* Called when RecyclerView needs a new RecyclerView.ViewHolder of the given type
     * to represent an item. */
    @Override
    public CustomViewHolder onCreateViewHolder(ViewGroup viewGroup, int viewType) {
        View view = LayoutInflater.from(viewGroup.getContext())
                .inflate(R.layout.skill_list, viewGroup, false);

        CustomViewHolder viewHolder = new CustomViewHolder(view);
        if(color == 0)
            view.setBackgroundResource(R.drawable.grass_back);
        else if(color == 1)
            view.setBackgroundResource(R.drawable.fire_back);
        else
            view.setBackgroundResource(R.drawable.water_back);




        return viewHolder;
    }

    public void updateLevle(int level){
        this.level = level;
    }
    /* Called when notifyItemChanged */
    @Override
    public void onBindViewHolder(@NonNull CustomViewHolder viewholder, int position) {
        Skill data;
        data = mList.get(position);
        viewholder.name.setText(data.getName());
        viewholder.level.setText("LV."+Integer.toString(data.getLevel()));

        if(Math.pow((position+1),2)>level) {
            viewholder.bt.setVisibility(View.INVISIBLE);
        }else{
            viewholder.bt.setVisibility(View.VISIBLE);

        }

        Log.i("viewholder:",data.getName()+data.getLevel());
    }
    @Override
    public int getItemCount() {
        return (null != mList ? mList.size() : 0);
    }
    public Skill getItem(int position){
        if(position < 0)
            return mList.get(0);
        return mList.get(position);
    }
    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public int getItemViewType(int position) {
        return position;
    }
}